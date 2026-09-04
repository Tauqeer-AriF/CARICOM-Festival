import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db/database';

// Import default/initial data to seed SQLite
import { DEFAULT_SITE_CONFIG, INITIAL_DEMO_SUBMISSIONS, INITIAL_DEMO_MEDIA } from './src/services/submissionService';
import { FESTIVAL_EVENTS, FESTIVAL_HOTELS, FESTIVAL_PASSES, FESTIVAL_TESTIMONIALS, FESTIVAL_IMAGES } from './src/data/festivalData';
import { GALLERY_ITEMS } from './src/data/galleryData';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Determine dynamic storage directory (support persistent Railway /data volume)
  let storageDir = process.cwd();
  if (fs.existsSync('/data')) {
    try {
      fs.accessSync('/data', fs.constants.W_OK);
      storageDir = '/data';
      console.log('[SYSTEM CONFIG] Persistent storage volume detected at /data. Redirecting SQLite database, uploads, and backups there.');
    } catch (e) {
      console.warn('[SYSTEM CONFIG] Persistent storage directory /data exists but is not writable, falling back to process.cwd()');
    }
  }

  // Body parsing middleware
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // Setup disk upload directory and Multer storage
  const uploadsDir = path.join(storageDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Setup upload storage in memory for Sharp image processing
  const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB max limit
  });

  // Serve binary uploads statically with video byte-range streaming and MIME headers
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
      else if (lower.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
      else if (lower.endsWith('.mov')) res.setHeader('Content-Type', 'video/quicktime');
      else if (lower.endsWith('.m4v')) res.setHeader('Content-Type', 'video/x-m4v');
      else if (lower.endsWith('.ogv') || lower.endsWith('.ogg')) res.setHeader('Content-Type', 'video/ogg');
      else if (lower.endsWith('.avi')) res.setHeader('Content-Type', 'video/x-msvideo');
      else if (lower.endsWith('.mkv')) res.setHeader('Content-Type', 'video/x-matroska');
      else if (lower.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    }
  }));

  // Helper to get database connection
  const db = await getDb();

  // Seeding routine: runs ONCE on first bootstrap to populate default demo data safely.
  // Never re-seeds on GET calls if data is deleted by user.
  async function ensureDatabaseSeeded() {
    try {
      const row = await db.get("SELECT value FROM system_meta WHERE key = 'seeded'");
      if (!row) {
        console.log('[DATABASE SEED] Initializing database seed for the first time...');

        // Seed site_config if missing
        const configRow = await db.get('SELECT id FROM site_config WHERE id = ?', 'main');
        if (!configRow) {
          const seedConfig = { ...DEFAULT_SITE_CONFIG, updatedAt: new Date().toISOString() };
          await db.run('INSERT INTO site_config (id, data_json) VALUES (?, ?)', 'main', JSON.stringify(seedConfig));
        }

        // Seed submissions
        const subCount = await db.get('SELECT COUNT(*) as count FROM submissions');
        if (!subCount || subCount.count === 0) {
          for (const sub of INITIAL_DEMO_SUBMISSIONS) {
            await db.run('INSERT OR REPLACE INTO submissions (id, data_json) VALUES (?, ?)', sub.id, JSON.stringify(sub));
          }
        }

        // Seed events
        const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
        if (!eventCount || eventCount.count === 0) {
          for (const item of FESTIVAL_EVENTS) {
            await db.run('INSERT OR REPLACE INTO events (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        // Seed gallery
        const galleryCount = await db.get('SELECT COUNT(*) as count FROM gallery');
        if (!galleryCount || galleryCount.count === 0) {
          for (const item of GALLERY_ITEMS) {
            await db.run('INSERT OR REPLACE INTO gallery (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        // Seed hotels
        const hotelCount = await db.get('SELECT COUNT(*) as count FROM hotels');
        if (!hotelCount || hotelCount.count === 0) {
          for (const item of FESTIVAL_HOTELS) {
            await db.run('INSERT OR REPLACE INTO hotels (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        // Seed passes
        const passCount = await db.get('SELECT COUNT(*) as count FROM passes');
        if (!passCount || passCount.count === 0) {
          for (const item of FESTIVAL_PASSES) {
            await db.run('INSERT OR REPLACE INTO passes (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        // Seed testimonials
        const testimonialCount = await db.get('SELECT COUNT(*) as count FROM testimonials');
        if (!testimonialCount || testimonialCount.count === 0) {
          for (const item of FESTIVAL_TESTIMONIALS) {
            await db.run('INSERT OR REPLACE INTO testimonials (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        // Seed media
        const mediaCount = await db.get('SELECT COUNT(*) as count FROM media');
        if (!mediaCount || mediaCount.count === 0) {
          for (const item of INITIAL_DEMO_MEDIA) {
            await db.run('INSERT OR REPLACE INTO media (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          }
        }

        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('seeded', 'true')");
        console.log('[DATABASE SEED] Initial seed complete and locked.');
      }
    } catch (err) {
      console.error('[DATABASE SEED ERROR]', err);
    }
  }

  await ensureDatabaseSeeded();

  // Binary File Upload API Endpoint (Automated Sharp WebP Conversion & Compression)
  app.post('/api/upload', uploadMemory.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const mime = req.file.mimetype || '';
      const rawExt = path.extname(req.file.originalname || '');
      let originalExt = rawExt.toLowerCase();

      // Deduce extension from MIME if missing
      if (!originalExt) {
        if (mime.includes('mp4')) originalExt = '.mp4';
        else if (mime.includes('webm')) originalExt = '.webm';
        else if (mime.includes('quicktime') || mime.includes('mov')) originalExt = '.mov';
        else if (mime.includes('ogg')) originalExt = '.ogv';
        else if (mime.includes('x-matroska') || mime.includes('mkv')) originalExt = '.mkv';
        else if (mime.includes('jpeg') || mime.includes('jpg')) originalExt = '.jpg';
        else if (mime.includes('png')) originalExt = '.png';
        else if (mime.includes('webp')) originalExt = '.webp';
        else if (mime.includes('svg')) originalExt = '.svg';
        else originalExt = '.bin';
      }

      const isRasterImage = mime.startsWith('image/') && !mime.includes('svg') && originalExt !== '.svg';
      const originalSize = req.file.size || req.file.buffer.length;

      if (isRasterImage) {
        // Convert to optimized WebP format with sharp
        const baseName = path.basename(req.file.originalname || 'image', rawExt);
        const sanitizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) || 'image';
        const webpFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedBase}.webp`;
        const targetPath = path.join(uploadsDir, webpFilename);

        await sharp(req.file.buffer)
          .rotate() // Auto-rotate according to EXIF orientation
          .resize({
            width: 2560,
            height: 2560,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({
            quality: 80,
            effort: 4,
            lossless: false
          })
          .toFile(targetPath);

        const compressedStats = fs.statSync(targetPath);
        const compressedSize = compressedStats.size;
        const savingsPercent = originalSize > 0 
          ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
          : '0.0';

        console.log(`[IMAGE OPTIMIZER] Converted ${req.file.originalname} -> ${webpFilename} (${(originalSize / 1024).toFixed(1)} KB -> ${(compressedSize / 1024).toFixed(1)} KB, ${savingsPercent}% savings)`);

        return res.json({
          url: `/uploads/${webpFilename}`,
          filename: webpFilename,
          originalName: req.file.originalname,
          size: compressedSize,
          originalSize,
          compressedSize,
          savingsPercent: `${savingsPercent}%`,
          mimetype: 'image/webp',
          format: 'webp'
        });
      } else {
        // Non-raster image (SVG) or Video/Audio/PDF: save directly to disk
        const baseName = path.basename(req.file.originalname || 'media', rawExt);
        const sanitizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) || 'media';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedBase}${originalExt}`;
        const targetPath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(targetPath, req.file.buffer);

        // Infer accurate video/audio/document MIME type
        let determinedMime = mime;
        if (!determinedMime || determinedMime === 'application/octet-stream') {
          if (originalExt === '.mp4') determinedMime = 'video/mp4';
          else if (originalExt === '.webm') determinedMime = 'video/webm';
          else if (originalExt === '.mov') determinedMime = 'video/quicktime';
          else if (originalExt === '.m4v') determinedMime = 'video/x-m4v';
          else if (originalExt === '.ogv' || originalExt === '.ogg') determinedMime = 'video/ogg';
          else if (originalExt === '.avi') determinedMime = 'video/x-msvideo';
          else if (originalExt === '.mkv') determinedMime = 'video/x-matroska';
          else if (originalExt === '.svg') determinedMime = 'image/svg+xml';
        }

        console.log(`[MEDIA UPLOAD] Saved ${req.file.originalname} -> ${uniqueName} (${(originalSize / 1024).toFixed(1)} KB, mime: ${determinedMime})`);

        return res.json({
          url: `/uploads/${uniqueName}`,
          filename: uniqueName,
          originalName: req.file.originalname,
          size: originalSize,
          originalSize,
          compressedSize: originalSize,
          savingsPercent: '0%',
          mimetype: determinedMime,
          format: originalExt.replace('.', '')
        });
      }
    } catch (err: any) {
      console.error('[Upload Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Retroactive Batch Optimization for Existing Media in uploads/ directory
  app.post('/api/admin/optimize-existing-media', async (req, res) => {
    try {
      if (!fs.existsSync(uploadsDir)) {
        return res.json({ success: true, processedCount: 0, totalSavedBytes: 0, savedFormatted: '0 MB', message: 'Uploads directory is empty.' });
      }

      const files = fs.readdirSync(uploadsDir);
      let processedCount = 0;
      let totalSavedBytes = 0;
      const urlReplacements: Record<string, string> = {};

      for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext)) {
          const filePath = path.join(uploadsDir, filename);
          if (!fs.existsSync(filePath)) continue;

          try {
            const stats = fs.statSync(filePath);
            const originalSize = stats.size;
            const baseName = path.basename(filename, ext);
            const newWebpFilename = `${baseName}.webp`;
            const webpPath = path.join(uploadsDir, newWebpFilename);

            await sharp(filePath)
              .rotate()
              .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 80, effort: 4 })
              .toFile(webpPath);

            const webpStats = fs.statSync(webpPath);
            const webpSize = webpStats.size;

            if (webpSize < originalSize) {
              fs.unlinkSync(filePath);
              const saved = originalSize - webpSize;
              totalSavedBytes += saved;
              processedCount++;

              const oldUrl = `/uploads/${filename}`;
              const newUrl = `/uploads/${newWebpFilename}`;
              urlReplacements[oldUrl] = newUrl;
            } else {
              fs.unlinkSync(webpPath);
            }
          } catch (fileErr) {
            console.error(`[Batch Optimizer Error] ${filename}:`, fileErr);
          }
        }
      }

      if (Object.keys(urlReplacements).length > 0) {
        const updateTableUrls = async (tableName: string) => {
          const rows = await db.all(`SELECT id, data_json FROM ${tableName}`);
          for (const row of rows) {
            let jsonStr = row.data_json;
            let modified = false;
            for (const [oldUrl, newUrl] of Object.entries(urlReplacements)) {
              if (jsonStr.includes(oldUrl)) {
                jsonStr = jsonStr.replaceAll(oldUrl, newUrl);
                modified = true;
              }
            }
            if (modified) {
              await db.run(`UPDATE ${tableName} SET data_json = ? WHERE id = ?`, jsonStr, row.id);
            }
          }
        };

        await updateTableUrls('media');
        await updateTableUrls('site_config');
        await updateTableUrls('events');
        await updateTableUrls('gallery');
        await updateTableUrls('hotels');
        await updateTableUrls('testimonials');
        await updateTableUrls('submissions');

        broadcast('system_restored');
      }

      const savedMB = (totalSavedBytes / (1024 * 1024)).toFixed(2);
      res.json({
        success: true,
        processedCount,
        totalSavedBytes,
        savedFormatted: `${savedMB} MB`,
        message: processedCount > 0 
          ? `Optimized ${processedCount} image(s) to WebP format, saving ${savedMB} MB of disk space & bandwidth!`
          : 'All images are already fully compressed in WebP format.'
      });
    } catch (e: any) {
      console.error('[Batch Optimization Failed]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // SSE Real-Time Updates Clients
  const clients = new Set<express.Response>();

  // Helper to broadcast database updates
  function broadcast(type: string, senderId?: string) {
    const payload = JSON.stringify({ type, senderId });
    console.log(`[SSE] Broadcasting: ${payload} to ${clients.size} clients`);
    const message = `data: ${payload}\n\n`;
    for (const res of clients) {
      try {
        res.write(message);
      } catch (err) {
        console.warn('[SSE] Error writing to client:', err);
        clients.delete(res);
      }
    }
  }

  // Real-Time Updates endpoint
  app.get('/api/realtime-updates', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(': connected\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
  });

  // API Route: Site Config
  app.get('/api/site-config', async (req, res) => {
    try {
      const row = await db.get('SELECT data_json FROM site_config WHERE id = ?', 'main');
      if (!row) {
        return res.json(DEFAULT_SITE_CONFIG);
      }
      res.json(JSON.parse(row.data_json));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/site-config', async (req, res) => {
    try {
      const config = req.body;
      await db.run('INSERT OR REPLACE INTO site_config (id, data_json) VALUES (?, ?)', 'main', JSON.stringify(config));
      const senderId = req.headers['x-client-id'] as string;
      broadcast('site_config', senderId);
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Submissions
  app.get('/api/submissions', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM submissions');
      const subs = rows.map(r => JSON.parse(r.data_json));
      // Sort descending by submittedAt
      subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      res.json(subs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/submissions', async (req, res) => {
    try {
      const sub = req.body;
      const newSub = {
        ...sub,
        id: sub.id || `sub-${Date.now()}`,
        submittedAt: sub.submittedAt || new Date().toISOString(),
        status: sub.status || 'new'
      };
      await db.run('INSERT OR REPLACE INTO submissions (id, data_json) VALUES (?, ?)', newSub.id, JSON.stringify(newSub));
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json(newSub);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/submissions/batch', async (req, res) => {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected an array of submissions in request body or items field' });
      }

      await db.run('BEGIN TRANSACTION');
      for (const item of items) {
        const sub = {
          ...item,
          id: item.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          submittedAt: item.submittedAt || new Date().toISOString(),
          status: item.status || 'new'
        };
        await db.run('INSERT OR REPLACE INTO submissions (id, data_json) VALUES (?, ?)', sub.id, JSON.stringify(sub));
      }
      await db.run('COMMIT');

      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json({ success: true, count: items.length });
    } catch (e: any) {
      try { await db.run('ROLLBACK'); } catch {}
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/submissions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const row = await db.get('SELECT data_json FROM submissions WHERE id = ?', id);
      if (!row) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      const existing = JSON.parse(row.data_json);
      const merged = { ...existing, ...updatedData, id };
      await db.run('UPDATE submissions SET data_json = ? WHERE id = ?', JSON.stringify(merged), id);
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json(merged);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/submissions/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const row = await db.get('SELECT data_json FROM submissions WHERE id = ?', id);
      if (!row) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      const sub = JSON.parse(row.data_json);
      sub.status = status;
      await db.run('UPDATE submissions SET data_json = ? WHERE id = ?', JSON.stringify(sub), id);
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json(sub);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/submissions/:id/replies', async (req, res) => {
    try {
      const { id } = req.params;
      const reply = req.body;
      const row = await db.get('SELECT data_json FROM submissions WHERE id = ?', id);
      if (!row) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      const sub = JSON.parse(row.data_json);
      const existingReplies = sub.replies || [];
      const newReply = {
        ...reply,
        id: reply.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sentAt: reply.sentAt || new Date().toISOString()
      };
      sub.replies = [newReply, ...existingReplies];
      sub.status = 'resolved'; // automatically set to resolved upon reply
      await db.run('UPDATE submissions SET data_json = ? WHERE id = ?', JSON.stringify(sub), id);
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json(sub);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/submissions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.run('DELETE FROM submissions WHERE id = ?', id);
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/submissions/reset', async (req, res) => {
    try {
      await db.run('DELETE FROM submissions');
      for (const sub of INITIAL_DEMO_SUBMISSIONS) {
        await db.run('INSERT INTO submissions (id, data_json) VALUES (?, ?)', sub.id, JSON.stringify(sub));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('submissions', senderId);
      res.json(INITIAL_DEMO_SUBMISSIONS);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // API Routes: Email Suite & Communications
  // ==========================================
  app.get('/api/email/settings', async (req, res) => {
    try {
      const row = await db.get("SELECT data_json FROM email_settings WHERE id = 'main'");
      if (row && row.data_json) {
        return res.json(JSON.parse(row.data_json));
      }
      res.json(null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/settings', async (req, res) => {
    try {
      const settings = req.body;
      await db.run(
        "INSERT OR REPLACE INTO email_settings (id, data_json) VALUES ('main', ?)",
        JSON.stringify(settings)
      );
      res.json({ success: true, settings });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/email/templates', async (req, res) => {
    try {
      const rows = await db.all("SELECT data_json FROM email_templates");
      const templates = rows.map(r => JSON.parse(r.data_json));
      res.json(templates);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/templates', async (req, res) => {
    try {
      const templates = req.body;
      if (Array.isArray(templates)) {
        await db.run("DELETE FROM email_templates");
        for (const t of templates) {
          await db.run(
            "INSERT INTO email_templates (id, data_json) VALUES (?, ?)",
            t.id,
            JSON.stringify(t)
          );
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/email/logs', async (req, res) => {
    try {
      const rows = await db.all("SELECT data_json FROM email_logs ORDER BY created_at DESC LIMIT 200");
      const logs = rows.map(r => JSON.parse(r.data_json));
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/logs', async (req, res) => {
    try {
      const log = req.body;
      const createdAt = log.dispatchedAt || new Date().toISOString();
      await db.run(
        "INSERT OR REPLACE INTO email_logs (id, data_json, created_at) VALUES (?, ?, ?)",
        log.id,
        JSON.stringify(log),
        createdAt
      );
      res.json({ success: true, log });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/email/logs/:id', async (req, res) => {
    try {
      await db.run("DELETE FROM email_logs WHERE id = ?", req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/logs/clear', async (req, res) => {
    try {
      await db.run("DELETE FROM email_logs");
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/dispatch', async (req, res) => {
    try {
      const {
        recipientEmail,
        recipientName,
        subject,
        category,
        contentHtml,
        contentText,
        referenceId,
        settings,
        metadata
      } = req.body;

      let status: 'delivered' | 'failed' = 'delivered';
      let message = '';
      let errorDetails: string | undefined = undefined;

      // 1. Resend SaaS API Dispatch
      if (settings && settings.engineMode === 'resend') {
        if (!settings.resendApiKey || !settings.resendApiKey.trim()) {
          status = 'failed';
          errorDetails = 'Resend API key is not configured in Email Settings.';
          message = 'Delivery failed: Resend API key is missing. Please configure it in Mailbox Settings.';
        } else {
          try {
            const fromAddress = settings.senderEmail && !settings.senderEmail.includes('grenadacaricom2027.com')
              ? `"${settings.senderName || 'Grenada CARICOM Festival'}" <${settings.senderEmail}>`
              : `"${settings.senderName || 'Grenada CARICOM Festival'}" <onboarding@resend.dev>`;

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.resendApiKey.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: fromAddress,
                to: [recipientEmail],
                subject: subject,
                html: contentHtml,
                text: contentText || subject,
                reply_to: settings.replyToEmail || undefined
              })
            });

            const resendData = await resendRes.json();
            if (!resendRes.ok) {
              throw new Error(resendData.message || `Resend HTTP ${resendRes.status}`);
            }
            status = 'delivered';
            message = `Email successfully delivered to ${recipientEmail} via Resend API (Message ID: ${resendData.id || 'confirmed'}).`;
          } catch (resendErr: any) {
            console.error('[EMAIL ENGINE] Resend delivery error:', resendErr.message);
            status = 'failed';
            errorDetails = resendErr.message;
            message = `Resend delivery failed: ${resendErr.message}`;
          }
        }
      }
      // 2. Twilio SendGrid SaaS API Dispatch
      else if (settings && settings.engineMode === 'sendgrid') {
        if (!settings.sendgridApiKey || !settings.sendgridApiKey.trim()) {
          status = 'failed';
          errorDetails = 'Twilio SendGrid API key is not configured in Email Settings.';
          message = 'Delivery failed: SendGrid API key is missing. Please configure it in Mailbox Settings.';
        } else {
          try {
            const sendgridRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.sendgridApiKey.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                personalizations: [{
                  to: [{ email: recipientEmail, name: recipientName || undefined }]
                }],
                from: {
                  email: settings.senderEmail || 'concierge@grenadacaricom2027.com',
                  name: settings.senderName || 'Grenada CARICOM Festival'
                },
                reply_to: {
                  email: settings.replyToEmail || settings.senderEmail || 'concierge@grenadacaricom2027.com'
                },
                subject: subject,
                content: [
                  { type: 'text/plain', value: contentText || subject },
                  { type: 'text/html', value: contentHtml }
                ]
              })
            });

            if (!sendgridRes.ok) {
              const errText = await sendgridRes.text();
              let parsedErr = errText;
              try {
                const jsonErr = JSON.parse(errText);
                parsedErr = jsonErr.errors?.[0]?.message || errText;
              } catch {}
              throw new Error(parsedErr || `SendGrid HTTP ${sendgridRes.status}`);
            }
            status = 'delivered';
            message = `Email successfully delivered to ${recipientEmail} via Twilio SendGrid API.`;
          } catch (sgErr: any) {
            console.error('[EMAIL ENGINE] SendGrid delivery error:', sgErr.message);
            status = 'failed';
            errorDetails = sgErr.message;
            message = `SendGrid delivery failed: ${sgErr.message}`;
          }
        }
      }
      // 3. Mailchimp Transactional / Mandrill SaaS API Dispatch
      else if (settings && settings.engineMode === 'mailchimp') {
        if (!settings.mailchimpApiKey || !settings.mailchimpApiKey.trim()) {
          status = 'failed';
          errorDetails = 'Mailchimp Transactional API key is not configured in Email Settings.';
          message = 'Delivery failed: Mailchimp Mandrill API key is missing. Please configure it in Mailbox Settings.';
        } else {
          try {
            const mandrillRes = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: settings.mailchimpApiKey.trim(),
                message: {
                  html: contentHtml,
                  text: contentText || subject,
                  subject: subject,
                  from_email: settings.senderEmail || 'concierge@grenadacaricom2027.com',
                  from_name: settings.senderName || 'Grenada CARICOM Festival',
                  to: [{
                    email: recipientEmail,
                    name: recipientName || undefined,
                    type: 'to'
                  }],
                  headers: {
                    'Reply-To': settings.replyToEmail || settings.senderEmail || 'concierge@grenadacaricom2027.com'
                  }
                }
              })
            });

            const mandrillData = await mandrillRes.json();
            if (!mandrillRes.ok || (Array.isArray(mandrillData) && mandrillData[0]?.status === 'rejected')) {
              const errReason = Array.isArray(mandrillData) ? mandrillData[0]?.reject_reason : mandrillData.message;
              throw new Error(errReason || `Mailchimp HTTP ${mandrillRes.status}`);
            }
            status = 'delivered';
            message = `Email successfully delivered to ${recipientEmail} via Mailchimp Transactional API.`;
          } catch (mcErr: any) {
            console.error('[EMAIL ENGINE] Mailchimp delivery error:', mcErr.message);
            status = 'failed';
            errorDetails = mcErr.message;
            message = `Mailchimp delivery failed: ${mcErr.message}`;
          }
        }
      }
      // 4. Custom SMTP Gateway Dispatch
      else if (settings && settings.engineMode === 'smtp') {
        if (!settings.smtpUser || !settings.smtpPassword) {
          status = 'failed';
          errorDetails = 'SMTP username and password credentials are not configured.';
          message = 'Delivery failed: SMTP credentials are not configured in Mailbox Settings.';
        } else {
          try {
            const transporter = nodemailer.createTransport({
              host: settings.smtpHost || 'smtp.gmail.com',
              port: Number(settings.smtpPort) || 587,
              secure: Boolean(settings.smtpSecure),
              auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword
              },
              tls: {
                rejectUnauthorized: false
              }
            });

            await transporter.sendMail({
              from: `"${settings.senderName || 'Grenada CARICOM Festival'}" <${settings.senderEmail || settings.smtpUser}>`,
              to: recipientName ? `"${recipientName}" <${recipientEmail}>` : recipientEmail,
              subject: subject,
              text: contentText || subject,
              html: contentHtml,
              replyTo: settings.replyToEmail || settings.senderEmail
            });

            status = 'delivered';
            message = `Email successfully delivered to ${recipientEmail} via SMTP server.`;
          } catch (smtpErr: any) {
            console.error('[EMAIL ENGINE] SMTP delivery error:', smtpErr.message);
            status = 'failed';
            errorDetails = smtpErr.message;
            message = `SMTP delivery failed: ${smtpErr.message}`;
          }
        }
      } else {
        status = 'failed';
        errorDetails = 'No valid email delivery provider is configured.';
        message = 'Please select a delivery provider (Resend, SendGrid, Mailchimp, or SMTP) and enter your credentials in Mailbox Settings.';
      }

      // Store in SQLite email_logs
      const logId = `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const logEntry = {
        id: logId,
        recipientEmail,
        recipientName,
        subject,
        category: category || 'system_alert',
        contentHtml,
        contentText,
        status,
        dispatchedAt: new Date().toISOString(),
        senderName: settings?.senderName || 'Grenada CARICOM Festival Secretariat',
        senderEmail: settings?.senderEmail || 'concierge@grenadacaricom2027.com',
        referenceId: referenceId || `GCF-2027-${Math.floor(1000 + Math.random() * 9000)}`,
        metadata,
        errorDetails
      };

      await db.run(
        "INSERT INTO email_logs (id, data_json, created_at) VALUES (?, ?, ?)",
        logId,
        JSON.stringify(logEntry),
        logEntry.dispatchedAt
      );

      res.json({
        success: status === 'delivered',
        status,
        message,
        error: errorDetails,
        log: logEntry
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/email/test', async (req, res) => {
    try {
      const { testRecipient, settings } = req.body;
      if (!testRecipient) {
        return res.status(400).json({ error: 'Please specify a test recipient email address.' });
      }

      // 1. Resend Verification Test
      if (settings && settings.engineMode === 'resend') {
        if (!settings.resendApiKey || !settings.resendApiKey.trim()) {
          return res.json({
            success: false,
            status: 'failed',
            message: 'Please provide your Resend API Key (e.g. re_...) in the settings field to test connectivity.'
          });
        }

        try {
          const fromAddress = settings.senderEmail && !settings.senderEmail.includes('grenadacaricom2027.com')
            ? `"${settings.senderName || 'Grenada CARICOM Festival'}" <${settings.senderEmail}>`
            : `"${settings.senderName || 'Grenada CARICOM Festival'}" <onboarding@resend.dev>`;

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.resendApiKey.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [testRecipient],
              subject: 'Official Verification Test — Grenada CARICOM Festival 2027',
              text: 'This is a test communiqué verifying the Resend SaaS connectivity for the Grenada CARICOM Festival 2027.',
              html: '<div style="font-family: Georgia, serif; padding: 24px; background: #0c0f14; color: #fff; border-radius: 14px; border: 1px solid rgba(245, 158, 11, 0.4);"><h2 style="color: #F59E0B; margin: 0 0 10px 0;">Grenada CARICOM Festival 2027</h2><p style="color: #e5e5e5; font-size: 14px;">Resend API connection test successful. Outgoing communications are verified and operational.</p></div>'
            })
          });

          const data = await resendRes.json();
          if (!resendRes.ok) {
            throw new Error(data.message || `Resend HTTP ${resendRes.status}`);
          }

          return res.json({
            success: true,
            status: 'delivered',
            message: `Resend API verified successfully! Dispatched test ID: ${data.id || 'ok'}`
          });
        } catch (resendErr: any) {
          return res.json({
            success: false,
            status: 'failed',
            message: `Resend test error: ${resendErr.message}`
          });
        }
      }

      // 2. SendGrid Verification Test
      if (settings && settings.engineMode === 'sendgrid') {
        if (!settings.sendgridApiKey || !settings.sendgridApiKey.trim()) {
          return res.json({
            success: false,
            status: 'failed',
            message: 'Please provide your Twilio SendGrid API Key (e.g. SG....) to test connectivity.'
          });
        }

        try {
          const sendgridRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.sendgridApiKey.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: testRecipient }] }],
              from: {
                email: settings.senderEmail || 'concierge@grenadacaricom2027.com',
                name: settings.senderName || 'Grenada CARICOM Festival'
              },
              subject: 'Official Verification Test — Grenada CARICOM Festival 2027',
              content: [
                {
                  type: 'text/html',
                  value: '<div style="font-family: Georgia, serif; padding: 24px; background: #0c0f14; color: #fff; border-radius: 14px; border: 1px solid rgba(245, 158, 11, 0.4);"><h2 style="color: #F59E0B; margin: 0 0 10px 0;">Grenada CARICOM Festival 2027</h2><p style="color: #e5e5e5; font-size: 14px;">SendGrid API test verified! Communications are operational.</p></div>'
                }
              ]
            })
          });

          if (!sendgridRes.ok) {
            const errText = await sendgridRes.text();
            let parsed = errText;
            try {
              const j = JSON.parse(errText);
              parsed = j.errors?.[0]?.message || errText;
            } catch {}
            throw new Error(parsed || `SendGrid HTTP ${sendgridRes.status}`);
          }

          return res.json({
            success: true,
            status: 'delivered',
            message: 'SendGrid API verified successfully! Test email dispatched.'
          });
        } catch (sgErr: any) {
          return res.json({
            success: false,
            status: 'failed',
            message: `SendGrid test error: ${sgErr.message}`
          });
        }
      }

      // 3. Mailchimp Transactional / Mandrill Test
      if (settings && settings.engineMode === 'mailchimp') {
        if (!settings.mailchimpApiKey || !settings.mailchimpApiKey.trim()) {
          return res.json({
            success: false,
            status: 'failed',
            message: 'Please provide your Mailchimp Mandrill API Key to test connectivity.'
          });
        }

        try {
          const mandrillRes = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: settings.mailchimpApiKey.trim(),
              message: {
                html: '<div style="font-family: Georgia, serif; padding: 24px; background: #0c0f14; color: #fff; border-radius: 14px; border: 1px solid rgba(245, 158, 11, 0.4);"><h2 style="color: #F59E0B; margin: 0 0 10px 0;">Grenada CARICOM Festival 2027</h2><p style="color: #e5e5e5; font-size: 14px;">Mailchimp Mandrill connection test verified!</p></div>',
                text: 'Mailchimp connection test verified.',
                subject: 'Official Verification Test — Grenada CARICOM Festival 2027',
                from_email: settings.senderEmail || 'concierge@grenadacaricom2027.com',
                from_name: settings.senderName || 'Grenada CARICOM Festival',
                to: [{ email: testRecipient, type: 'to' }]
              }
            })
          });

          const mandrillData = await mandrillRes.json();
          if (!mandrillRes.ok || (Array.isArray(mandrillData) && mandrillData[0]?.status === 'rejected')) {
            const errReason = Array.isArray(mandrillData) ? mandrillData[0]?.reject_reason : mandrillData.message;
            throw new Error(errReason || `Mailchimp HTTP ${mandrillRes.status}`);
          }

          return res.json({
            success: true,
            status: 'delivered',
            message: 'Mailchimp Transactional API verified successfully! Test email dispatched.'
          });
        } catch (mcErr: any) {
          return res.json({
            success: false,
            status: 'failed',
            message: `Mailchimp test error: ${mcErr.message}`
          });
        }
      }

      // 4. Custom SMTP Gateway Test
      if (settings && settings.engineMode === 'smtp' && settings.smtpUser && settings.smtpPassword) {
        try {
          const transporter = nodemailer.createTransport({
            host: settings.smtpHost || 'smtp.gmail.com',
            port: Number(settings.smtpPort) || 587,
            secure: Boolean(settings.smtpSecure),
            auth: {
              user: settings.smtpUser,
              pass: settings.smtpPassword
            },
            tls: { rejectUnauthorized: false }
          });

          await transporter.verify();
          await transporter.sendMail({
            from: `"${settings.senderName || 'Festival Secretariat'}" <${settings.senderEmail || settings.smtpUser}>`,
            to: testRecipient,
            subject: 'Official Verification Test — Grenada CARICOM Festival 2027',
            text: 'This is a test communiqué verifying the outgoing email connectivity for the Grenada CARICOM Festival 2027.',
            html: '<div style="font-family: Arial, sans-serif; padding: 20px; background: #0c0f14; color: #fff; border-radius: 12px;"><h2 style="color: #F59E0B;">Grenada CARICOM Festival 2027</h2><p>Connection verification successful. Outgoing communications are fully operational.</p></div>'
          });

          return res.json({
            success: true,
            status: 'delivered',
            message: 'SMTP handshake and test dispatch completed successfully!'
          });
        } catch (smtpErr: any) {
          return res.json({
            success: false,
            status: 'failed',
            message: `SMTP test failed: ${smtpErr.message}`
          });
        }
      }

      // No valid email delivery provider credentials configured
      return res.json({
        success: false,
        status: 'failed',
        message: 'No email delivery credentials configured. Please select a provider (Resend, SendGrid, Mailchimp, or SMTP) and enter your credentials in Mailbox Settings.'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Events
  app.get('/api/events', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM events');
      const events = rows.map(r => JSON.parse(r.data_json));
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const events = req.body;
      await db.run('DELETE FROM events');
      for (const item of events) {
        await db.run('INSERT INTO events (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('events', senderId);
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Gallery
  app.get('/api/gallery', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM gallery');
      const items = rows.map(r => JSON.parse(r.data_json));
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/gallery', async (req, res) => {
    try {
      const items = req.body;
      await db.run('DELETE FROM gallery');
      for (const item of items) {
        await db.run('INSERT INTO gallery (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('gallery', senderId);
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Hotels
  app.get('/api/hotels', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM hotels');
      res.json(rows.map(r => JSON.parse(r.data_json)));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/hotels', async (req, res) => {
    try {
      const hotels = req.body;
      await db.run('DELETE FROM hotels');
      for (const item of hotels) {
        await db.run('INSERT INTO hotels (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('hotels', senderId);
      res.json(hotels);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Passes
  app.get('/api/passes', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM passes');
      res.json(rows.map(r => JSON.parse(r.data_json)));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/passes', async (req, res) => {
    try {
      const passes = req.body;
      await db.run('DELETE FROM passes');
      for (const item of passes) {
        await db.run('INSERT INTO passes (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('passes', senderId);
      res.json(passes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Testimonials
  app.get('/api/testimonials', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM testimonials');
      res.json(rows.map(r => JSON.parse(r.data_json)));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/testimonials', async (req, res) => {
    try {
      const list = req.body;
      await db.run('DELETE FROM testimonials');
      for (const item of list) {
        await db.run('INSERT INTO testimonials (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      const senderId = req.headers['x-client-id'] as string;
      broadcast('testimonials', senderId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Media
  app.get('/api/media', async (req, res) => {
    try {
      const rows = await db.all('SELECT data_json FROM media');
      const items = rows.map(r => JSON.parse(r.data_json));
      items.sort((a: any, b: any) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/media', async (req, res) => {
    try {
      const item = req.body;
      await db.run('INSERT OR REPLACE INTO media (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      const senderId = req.headers['x-client-id'] as string;
      broadcast('media', senderId);
      res.json(item);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.run('DELETE FROM media WHERE id = ?', id);
      const senderId = req.headers['x-client-id'] as string;
      broadcast('media', senderId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Route: Backup & Restore Endpoints
  const backupsDir = path.join(storageDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Export full backup (ZIP Archive with database + media binaries OR JSON database)
  app.get('/api/admin/backup/export', async (req, res) => {
    try {
      const format = (req.query.format as string) || 'zip'; // Default to ZIP for complete media backup

      const siteConfigRows = await db.all('SELECT * FROM site_config');
      const submissionsRows = await db.all('SELECT * FROM submissions');
      const eventsRows = await db.all('SELECT * FROM events');
      const galleryRows = await db.all('SELECT * FROM gallery');
      const hotelsRows = await db.all('SELECT * FROM hotels');
      const passesRows = await db.all('SELECT * FROM passes');
      const testimonialsRows = await db.all('SELECT * FROM testimonials');
      const mediaRows = await db.all('SELECT * FROM media');

      const parseRows = (rows: any[]) => rows.map(r => {
        try {
          return JSON.parse(r.data_json);
        } catch {
          return r;
        }
      });

      const tables = {
        site_config: parseRows(siteConfigRows),
        submissions: parseRows(submissionsRows),
        events: parseRows(eventsRows),
        gallery: parseRows(galleryRows),
        hotels: parseRows(hotelsRows),
        passes: parseRows(passesRows),
        testimonials: parseRows(testimonialsRows),
        media: parseRows(mediaRows)
      };

      const totalRecords = Object.values(tables).reduce((sum, arr) => sum + arr.length, 0);

      let dbSize = 0;
      const dbPath = path.resolve(storageDir, 'festival.db');
      if (fs.existsSync(dbPath)) {
        dbSize = fs.statSync(dbPath).size;
      }

      // Collect upload binary files
      let mediaFilesCount = 0;
      let uploadFilesList: string[] = [];
      if (fs.existsSync(uploadsDir)) {
        uploadFilesList = fs.readdirSync(uploadsDir).filter(f => {
          try {
            return fs.statSync(path.join(uploadsDir, f)).isFile();
          } catch {
            return false;
          }
        });
        mediaFilesCount = uploadFilesList.length;
      }

      const backupPackage = {
        version: '2027.1.0',
        system: 'CARICOM Festival Enterprise Database',
        exportedAt: new Date().toISOString(),
        dbSizeFormatted: (dbSize / 1024).toFixed(2) + ' KB',
        mediaFilesCount,
        summary: {
          site_config: tables.site_config.length,
          submissions: tables.submissions.length,
          events: tables.events.length,
          gallery: tables.gallery.length,
          hotels: tables.hotels.length,
          passes: tables.passes.length,
          testimonials: tables.testimonials.length,
          media: tables.media.length,
          totalRecords
        },
        tables
      };

      if (format === 'json') {
        const snapshotFilename = `auto-export-${Date.now()}.json`;
        fs.writeFileSync(path.join(backupsDir, snapshotFilename), JSON.stringify(backupPackage, null, 2));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="caricom-festival-backup-${Date.now()}.json"`);
        return res.json(backupPackage);
      }

      // Default: Complete ZIP Archive (Database + Uploaded Media Binaries)
      const zip = new AdmZip();
      zip.addFile('database.json', Buffer.from(JSON.stringify(backupPackage, null, 2)));
      zip.addFile('manifest.json', Buffer.from(JSON.stringify({
        version: '2027.1.0',
        exportedAt: new Date().toISOString(),
        totalRecords,
        mediaFilesCount,
        summary: backupPackage.summary
      }, null, 2)));

      // Pack uploaded media binary files into uploads/ folder in the ZIP
      if (fs.existsSync(uploadsDir)) {
        for (const filename of uploadFilesList) {
          const filePath = path.join(uploadsDir, filename);
          zip.addLocalFile(filePath, 'uploads');
        }
      }

      const zipBuffer = zip.toBuffer();
      const zipFilename = `caricom-festival-full-backup-${Date.now()}.zip`;

      // Auto-save snapshot copy
      fs.writeFileSync(path.join(backupsDir, `auto-export-${Date.now()}.zip`), zipBuffer);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      return res.send(zipBuffer);

    } catch (e: any) {
      console.error('[Backup Export Error]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Universal Backup Import Endpoint (Accepts .zip archive OR .json file/payload)
  app.post('/api/admin/backup/import', uploadMemory.single('file'), async (req, res) => {
    try {
      let backupData: any = null;
      let unpackedMediaCount = 0;

      if (req.file) {
        const fileBuffer = req.file.buffer;
        const originalName = (req.file.originalname || '').toLowerCase();

        if (originalName.endsWith('.zip') || req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') {
          const zip = new AdmZip(fileBuffer);
          const dbEntry = zip.getEntry('database.json') || zip.getEntry('backup.json');
          if (!dbEntry) {
            return res.status(400).json({ error: 'Invalid ZIP backup archive. Missing database.json file.' });
          }

          backupData = JSON.parse(zip.readAsText(dbEntry));

          // Unpack media files into uploadsDir
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const entries = zip.getEntries();
          for (const entry of entries) {
            if (!entry.isDirectory && entry.entryName.startsWith('uploads/')) {
              const fileBase = path.basename(entry.entryName);
              if (fileBase) {
                const targetPath = path.join(uploadsDir, fileBase);
                fs.writeFileSync(targetPath, entry.getData());
                unpackedMediaCount++;
              }
            }
          }
        } else {
          // JSON File
          backupData = JSON.parse(fileBuffer.toString('utf8'));
        }
      } else if (req.body.backupData || req.body.tables) {
        backupData = req.body.backupData || req.body;
      }

      if (!backupData || !backupData.tables) {
        return res.status(400).json({ error: 'Invalid backup file structure. Missing required database tables object.' });
      }

      // Safety: Create pre-restore snapshot
      try {
        const siteConfigRows = await db.all('SELECT * FROM site_config');
        const submissionsRows = await db.all('SELECT * FROM submissions');
        const eventsRows = await db.all('SELECT * FROM events');
        const galleryRows = await db.all('SELECT * FROM gallery');
        const hotelsRows = await db.all('SELECT * FROM hotels');
        const passesRows = await db.all('SELECT * FROM passes');
        const testimonialsRows = await db.all('SELECT * FROM testimonials');
        const mediaRows = await db.all('SELECT * FROM media');

        const safetySnapshot = {
          version: '2027.1.0',
          system: 'Pre-Restore Automated Safety Rollback',
          exportedAt: new Date().toISOString(),
          tables: {
            site_config: siteConfigRows.map(r => JSON.parse(r.data_json)),
            submissions: submissionsRows.map(r => JSON.parse(r.data_json)),
            events: eventsRows.map(r => JSON.parse(r.data_json)),
            gallery: galleryRows.map(r => JSON.parse(r.data_json)),
            hotels: hotelsRows.map(r => JSON.parse(r.data_json)),
            passes: passesRows.map(r => JSON.parse(r.data_json)),
            testimonials: testimonialsRows.map(r => JSON.parse(r.data_json)),
            media: mediaRows.map(r => JSON.parse(r.data_json))
          }
        };
        fs.writeFileSync(path.join(backupsDir, `pre-restore-safety-${Date.now()}.json`), JSON.stringify(safetySnapshot, null, 2));
      } catch (err) {
        console.warn('[Safety Snapshot Warning]', err);
      }

      const { tables } = backupData;

      // Overwrite database tables
      const restoreTable = async (tableName: string, items: any[]) => {
        await db.run(`DELETE FROM ${tableName}`);
        if (Array.isArray(items)) {
          for (const item of items) {
            const id = item.id || `${tableName}-${Math.random().toString(36).substring(2, 9)}`;
            await db.run(`INSERT INTO ${tableName} (id, data_json) VALUES (?, ?)`, id, JSON.stringify(item));
          }
        }
      };

      if (tables.site_config) await restoreTable('site_config', tables.site_config);
      if (tables.submissions) await restoreTable('submissions', tables.submissions);
      if (tables.events) await restoreTable('events', tables.events);
      if (tables.gallery) await restoreTable('gallery', tables.gallery);
      if (tables.hotels) await restoreTable('hotels', tables.hotels);
      if (tables.passes) await restoreTable('passes', tables.passes);
      if (tables.testimonials) await restoreTable('testimonials', tables.testimonials);
      if (tables.media) await restoreTable('media', tables.media);

      broadcast('system_restored');

      res.json({
        success: true,
        message: unpackedMediaCount > 0 
          ? `Full backup restored successfully! (${unpackedMediaCount} media files unpacked & synchronized)` 
          : 'Database backup restored successfully!',
        restored: true,
        unpackedMediaCount,
        restoredAt: new Date().toISOString()
      });

    } catch (e: any) {
      console.error('[Backup Import Error]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // List local auto-snapshots
  app.get('/api/admin/backup/snapshots', async (req, res) => {
    try {
      if (!fs.existsSync(backupsDir)) {
        return res.json([]);
      }
      const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json') || f.endsWith('.zip'));
      const snapshots = files.map(filename => {
        const filePath = path.join(backupsDir, filename);
        const stats = fs.statSync(filePath);
        let recordCount = 0;
        let mediaFilesCount = 0;
        let systemTag = filename.endsWith('.zip') ? 'Full System Archive (.zip)' : 'JSON Database (.json)';

        try {
          if (filename.endsWith('.zip')) {
            const zip = new AdmZip(filePath);
            const manifestEntry = zip.getEntry('manifest.json');
            const dbEntry = zip.getEntry('database.json');
            if (manifestEntry) {
              const manifest = JSON.parse(zip.readAsText(manifestEntry));
              recordCount = manifest.totalRecords || 0;
              mediaFilesCount = manifest.mediaFilesCount || 0;
            } else if (dbEntry) {
              const content = JSON.parse(zip.readAsText(dbEntry));
              recordCount = content.summary?.totalRecords || 0;
            }
          } else {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (content.summary?.totalRecords) {
              recordCount = content.summary.totalRecords;
            }
            if (content.system) {
              systemTag = content.system;
            }
          }
        } catch {}

        return {
          filename,
          isZip: filename.endsWith('.zip'),
          sizeBytes: stats.size,
          sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
          createdTime: stats.mtime.toISOString(),
          recordCount,
          mediaFilesCount,
          systemTag
        };
      }).sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

      res.json(snapshots);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Restore snapshot from local server snapshot file
  app.post('/api/admin/backup/restore-snapshot', async (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }
      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Snapshot file not found' });
      }

      let backupData: any = null;
      let unpackedMediaCount = 0;

      if (filename.endsWith('.zip')) {
        const zip = new AdmZip(filePath);
        const dbEntry = zip.getEntry('database.json') || zip.getEntry('backup.json');
        if (!dbEntry) {
          return res.status(400).json({ error: 'Invalid ZIP snapshot file' });
        }
        backupData = JSON.parse(zip.readAsText(dbEntry));

        // Extract media files
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const entries = zip.getEntries();
        for (const entry of entries) {
          if (!entry.isDirectory && entry.entryName.startsWith('uploads/')) {
            const fileBase = path.basename(entry.entryName);
            if (fileBase) {
              fs.writeFileSync(path.join(uploadsDir, fileBase), entry.getData());
              unpackedMediaCount++;
            }
          }
        }
      } else {
        backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }

      const { tables } = backupData;
      if (!tables) {
        return res.status(400).json({ error: 'Invalid snapshot format' });
      }

      const restoreTable = async (tableName: string, items: any[]) => {
        await db.run(`DELETE FROM ${tableName}`);
        if (Array.isArray(items)) {
          for (const item of items) {
            const id = item.id || `${tableName}-${Math.random().toString(36).substring(2, 9)}`;
            await db.run(`INSERT INTO ${tableName} (id, data_json) VALUES (?, ?)`, id, JSON.stringify(item));
          }
        }
      };

      if (tables.site_config) await restoreTable('site_config', tables.site_config);
      if (tables.submissions) await restoreTable('submissions', tables.submissions);
      if (tables.events) await restoreTable('events', tables.events);
      if (tables.gallery) await restoreTable('gallery', tables.gallery);
      if (tables.hotels) await restoreTable('hotels', tables.hotels);
      if (tables.passes) await restoreTable('passes', tables.passes);
      if (tables.testimonials) await restoreTable('testimonials', tables.testimonials);
      if (tables.media) await restoreTable('media', tables.media);

      broadcast('system_restored');

      res.json({
        success: true,
        message: `Restored snapshot ${filename} successfully. (${unpackedMediaCount} media files unpacked)`,
        restored: true
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete snapshot file
  app.delete('/api/admin/backup/snapshots/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(backupsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Download snapshot file (allows easy remote retrieval by tools or administrators)
  app.get('/api/admin/backup/snapshots/download/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Snapshot file not found' });
      }
      res.download(filePath, filename);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper to create point-in-time system backups (combines database rows and upload binary files)
  async function createSystemBackupSnapshot(label: string, forceExcludeMedia?: boolean): Promise<string> {
    const siteConfigRows = await db.all('SELECT * FROM site_config');
    const submissionsRows = await db.all('SELECT * FROM submissions');
    const eventsRows = await db.all('SELECT * FROM events');
    const galleryRows = await db.all('SELECT * FROM gallery');
    const hotelsRows = await db.all('SELECT * FROM hotels');
    const passesRows = await db.all('SELECT * FROM passes');
    const testimonialsRows = await db.all('SELECT * FROM testimonials');
    const mediaRows = await db.all('SELECT * FROM media');

    const parseRows = (rows: any[]) => rows.map(r => {
      try {
        return JSON.parse(r.data_json);
      } catch {
        return r;
      }
    });

    const tables = {
      site_config: parseRows(siteConfigRows),
      submissions: parseRows(submissionsRows),
      events: parseRows(eventsRows),
      gallery: parseRows(galleryRows),
      hotels: parseRows(hotelsRows),
      passes: parseRows(passesRows),
      testimonials: parseRows(testimonialsRows),
      media: parseRows(mediaRows)
    };

    const totalRecords = Object.values(tables).reduce((sum, arr) => sum + arr.length, 0);

    let excludeMediaSetting = false;
    try {
      const exRow = await db.get("SELECT value FROM system_meta WHERE key = 'exclude_media'");
      if (exRow && exRow.value === 'true') {
        excludeMediaSetting = true;
      }
    } catch {}

    const shouldExcludeMedia = forceExcludeMedia ?? excludeMediaSetting;

    let mediaFilesCount = 0;
    let uploadFilesList: string[] = [];
    if (!shouldExcludeMedia && fs.existsSync(uploadsDir)) {
      uploadFilesList = fs.readdirSync(uploadsDir).filter(f => {
        try {
          return fs.statSync(path.join(uploadsDir, f)).isFile();
        } catch {
          return false;
        }
      });
      mediaFilesCount = uploadFilesList.length;
    }

    const snapshotData = {
      version: '2027.1.0',
      system: label ? `${label}` : 'Automated Safety Backup',
      exportedAt: new Date().toISOString(),
      summary: { totalRecords, mediaFilesCount, mediaExcluded: shouldExcludeMedia },
      tables
    };

    const sanitizedLabel = (label || 'backup').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const zip = new AdmZip();
    zip.addFile('database.json', Buffer.from(JSON.stringify(snapshotData, null, 2)));
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({
      version: '2027.1.0',
      exportedAt: new Date().toISOString(),
      totalRecords,
      mediaFilesCount,
      mediaExcluded: shouldExcludeMedia,
      label
    }, null, 2)));

    if (!shouldExcludeMedia && fs.existsSync(uploadsDir)) {
      for (const filename of uploadFilesList) {
        zip.addLocalFile(path.join(uploadsDir, filename), 'uploads');
      }
    }

    const filename = `snapshot-${sanitizedLabel}-${Date.now()}.zip`;
    fs.writeFileSync(path.join(backupsDir, filename), zip.toBuffer());

    return filename;
  }

  // Create on-demand manual server snapshot using the helper
  app.post('/api/admin/backup/create-snapshot', async (req, res) => {
    try {
      const { label } = req.body;
      const filename = await createSystemBackupSnapshot(label ? `Manual: ${label}` : 'Manual Admin Snapshot');
      res.json({ success: true, filename });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get current automatic backup schedule configuration
  app.get('/api/admin/backup/schedule', async (req, res) => {
    try {
      const intervalRow = await db.get("SELECT value FROM system_meta WHERE key = 'backup_interval_hours'");
      const lastRow = await db.get("SELECT value FROM system_meta WHERE key = 'last_backup_time'");
      const excludeMediaRow = await db.get("SELECT value FROM system_meta WHERE key = 'exclude_media'");
      
      const intervalHours = intervalRow ? parseFloat(intervalRow.value) : 0;
      const lastBackupTime = lastRow ? lastRow.value : '';
      const excludeMedia = excludeMediaRow ? excludeMediaRow.value === 'true' : false;
      
      res.json({
        intervalHours,
        lastBackupTime,
        excludeMedia,
        enabled: intervalHours > 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Save new automatic backup schedule
  app.post('/api/admin/backup/schedule', async (req, res) => {
    try {
      const { intervalHours, excludeMedia } = req.body;
      const hoursNum = parseFloat(intervalHours);
      
      await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('backup_interval_hours', ?)", String(hoursNum));
      
      if (excludeMedia !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('exclude_media', ?)", excludeMedia ? 'true' : 'false');
      }
      
      const lastRow = await db.get("SELECT value FROM system_meta WHERE key = 'last_backup_time'");
      if (!lastRow) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('last_backup_time', ?)", new Date().toISOString());
      }
      
      const updatedLastRow = await db.get("SELECT value FROM system_meta WHERE key = 'last_backup_time'");
      
      broadcast('backup_schedule_updated');
      res.json({
        success: true,
        intervalHours: hoursNum,
        excludeMedia: excludeMedia,
        lastBackupTime: updatedLastRow ? updatedLastRow.value : '',
        enabled: hoursNum > 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // GOOGLE DRIVE CLOUD AUTO-BACKUP ENDPOINTS
  // ==========================================

  // Get current Google Drive settings and sync state
  app.get('/api/admin/backup/drive/settings', async (req, res) => {
    try {
      const autoRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_auto_upload_enabled'");
      const folderIdRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_id'");
      const folderNameRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_name'");
      const folderLinkRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_link'");
      const lastSyncRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_last_sync_time'");
      const userEmailRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_user_email'");
      const syncedRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_synced_snapshots'");

      let syncedSnapshotNames: string[] = [];
      try {
        if (syncedRow && syncedRow.value) {
          syncedSnapshotNames = JSON.parse(syncedRow.value);
        }
      } catch {}

      res.json({
        autoUploadEnabled: autoRow ? autoRow.value === 'true' : false,
        folderId: folderIdRow ? folderIdRow.value : undefined,
        folderName: folderNameRow ? folderNameRow.value : 'Grenada CARICOM Festival Backups 2027',
        folderWebViewLink: folderLinkRow ? folderLinkRow.value : undefined,
        lastSyncTime: lastSyncRow ? lastSyncRow.value : undefined,
        userEmail: userEmailRow ? userEmailRow.value : undefined,
        syncedSnapshotNames
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Save Google Drive sync settings
  app.post('/api/admin/backup/drive/settings', async (req, res) => {
    try {
      const { autoUploadEnabled, folderId, folderName, folderWebViewLink, userEmail } = req.body;

      if (autoUploadEnabled !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_auto_upload_enabled', ?)", autoUploadEnabled ? 'true' : 'false');
      }
      if (folderId !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_id', ?)", String(folderId));
      }
      if (folderName !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_name', ?)", String(folderName));
      }
      if (folderWebViewLink !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_link', ?)", String(folderWebViewLink));
      }
      if (userEmail !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_user_email', ?)", String(userEmail));
      }

      broadcast('gdrive_settings_updated');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Ensure dedicated Google Drive folder exists
  app.post('/api/admin/backup/drive/ensure-folder', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];
      const targetFolderName = 'Grenada CARICOM Festival Backups 2027';

      // 1. Check if folder already exists in user's Drive
      const query = encodeURIComponent(`name = '${targetFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        console.error('[GDRIVE FOLDER SEARCH ERROR]', errText);
        return res.status(searchRes.status).json({ error: 'Failed to access Google Drive: ' + errText });
      }

      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const folder = searchData.files[0];
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_id', ?)", folder.id);
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_name', ?)", folder.name);
        if (folder.webViewLink) {
          await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_link', ?)", folder.webViewLink);
        }
        return res.json({ folderId: folder.id, folderName: folder.name, webViewLink: folder.webViewLink });
      }

      // 2. Create new folder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: targetFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Automated and manual backup snapshots for Grenada CARICOM Festival 2027'
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error('[GDRIVE CREATE FOLDER ERROR]', errText);
        return res.status(createRes.status).json({ error: 'Failed to create Google Drive folder: ' + errText });
      }

      const newFolder = await createRes.json();
      await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_id', ?)", newFolder.id);
      await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_name', ?)", newFolder.name);
      if (newFolder.webViewLink) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_folder_link', ?)", newFolder.webViewLink);
      }

      return res.json({ folderId: newFolder.id, folderName: newFolder.name, webViewLink: newFolder.webViewLink });
    } catch (e: any) {
      console.error('[GDRIVE ENSURE FOLDER EXCEPTION]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // List all backup files in Google Drive folder
  app.get('/api/admin/backup/drive/list', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];

      let folderId = req.query.folderId as string;
      if (!folderId) {
        const folderIdRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_id'");
        if (folderIdRow) folderId = folderIdRow.value;
      }

      const query = folderId
        ? encodeURIComponent(`'${folderId}' in parents and trashed = false`)
        : encodeURIComponent(`name contains 'snapshot' or name contains 'backup' or mimeType = 'application/zip' and trashed = false`);

      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,webViewLink,webContentLink,description)&orderBy=createdTime%20desc`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        return res.status(listRes.status).json({ error: 'Failed to list files from Google Drive: ' + errText });
      }

      const listData = await listRes.json();
      const files = (listData.files || []).map((f: any) => {
        let sizeFormatted = 'Unknown';
        if (f.size) {
          const bytes = parseInt(f.size, 10);
          if (bytes < 1024) sizeFormatted = `${bytes} B`;
          else if (bytes < 1024 * 1024) sizeFormatted = `${(bytes / 1024).toFixed(1)} KB`;
          else sizeFormatted = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        return {
          ...f,
          sizeFormatted
        };
      });

      res.json({ files });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper function to upload buffer to Google Drive
  async function uploadBufferToGoogleDrive(token: string, filename: string, buffer: Buffer, folderId?: string, description?: string) {
    const boundary = '-------314159265358979323846' + Date.now();
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata: any = {
      name: filename,
      mimeType: 'application/zip',
      description: description || `Festival system backup snapshot archive uploaded on ${new Date().toLocaleString()}`
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const multipartRequestBody = Buffer.concat([
      Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n'),
      Buffer.from(delimiter + 'Content-Type: application/zip\r\n\r\n'),
      buffer,
      Buffer.from(close_delim)
    ]);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,webViewLink,webContentLink,description', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartRequestBody.length)
      },
      body: multipartRequestBody
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive upload error (${uploadRes.status}): ${errText}`);
    }

    return await uploadRes.json();
  }

  // Upload an existing local snapshot to Google Drive
  app.post('/api/admin/backup/drive/upload', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];
      const { snapshotFilename, folderId } = req.body;

      if (!snapshotFilename) {
        return res.status(400).json({ error: 'snapshotFilename is required' });
      }

      const filePath = path.join(backupsDir, snapshotFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Snapshot file not found on local disk' });
      }

      // Check folder ID if not passed
      let targetFolderId = folderId;
      if (!targetFolderId) {
        const folderRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_id'");
        if (folderRow) targetFolderId = folderRow.value;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const driveFile = await uploadBufferToGoogleDrive(token, snapshotFilename, fileBuffer, targetFolderId);

      // Record in synced snapshot history
      const nowIso = new Date().toISOString();
      await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_last_sync_time', ?)", nowIso);

      const syncedRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_synced_snapshots'");
      let syncedList: string[] = [];
      try {
        if (syncedRow && syncedRow.value) syncedList = JSON.parse(syncedRow.value);
      } catch {}
      if (!syncedList.includes(snapshotFilename)) {
        syncedList.push(snapshotFilename);
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_synced_snapshots', ?)", JSON.stringify(syncedList));
      }

      broadcast('gdrive_sync_completed');

      let sizeFormatted = 'Unknown';
      if (driveFile.size) {
        const bytes = parseInt(driveFile.size, 10);
        if (bytes < 1024) sizeFormatted = `${bytes} B`;
        else if (bytes < 1024 * 1024) sizeFormatted = `${(bytes / 1024).toFixed(1)} KB`;
        else sizeFormatted = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      }

      res.json({
        success: true,
        file: { ...driveFile, sizeFormatted },
        message: `Successfully uploaded ${snapshotFilename} to Google Drive`
      });
    } catch (e: any) {
      console.error('[GDRIVE UPLOAD ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Create on-demand snapshot and upload immediately to Google Drive
  app.post('/api/admin/backup/drive/create-and-upload', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];
      const { label, folderId } = req.body;

      const filename = await createSystemBackupSnapshot(label ? `Cloud: ${label}` : 'Manual Cloud Backup');
      const filePath = path.join(backupsDir, filename);
      const fileBuffer = fs.readFileSync(filePath);

      let targetFolderId = folderId;
      if (!targetFolderId) {
        const folderRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_folder_id'");
        if (folderRow) targetFolderId = folderRow.value;
      }

      const driveFile = await uploadBufferToGoogleDrive(token, filename, fileBuffer, targetFolderId);

      const nowIso = new Date().toISOString();
      await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_last_sync_time', ?)", nowIso);

      const syncedRow = await db.get("SELECT value FROM system_meta WHERE key = 'gdrive_synced_snapshots'");
      let syncedList: string[] = [];
      try {
        if (syncedRow && syncedRow.value) syncedList = JSON.parse(syncedRow.value);
      } catch {}
      if (!syncedList.includes(filename)) {
        syncedList.push(filename);
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('gdrive_synced_snapshots', ?)", JSON.stringify(syncedList));
      }

      broadcast('snapshots');
      broadcast('gdrive_sync_completed');

      let sizeFormatted = 'Unknown';
      if (driveFile.size) {
        const bytes = parseInt(driveFile.size, 10);
        if (bytes < 1024) sizeFormatted = `${bytes} B`;
        else if (bytes < 1024 * 1024) sizeFormatted = `${(bytes / 1024).toFixed(1)} KB`;
        else sizeFormatted = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      }

      res.json({
        success: true,
        filename,
        driveFile: { ...driveFile, sizeFormatted }
      });
    } catch (e: any) {
      console.error('[GDRIVE CREATE AND UPLOAD ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Restore directly from a Google Drive file ID
  app.post('/api/admin/backup/drive/restore', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];
      const { driveFileId } = req.body;

      if (!driveFileId) {
        return res.status(400).json({ error: 'driveFileId is required' });
      }

      // Download file stream from Google Drive
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!downloadRes.ok) {
        const errText = await downloadRes.text();
        return res.status(downloadRes.status).json({ error: 'Failed to download file from Google Drive: ' + errText });
      }

      const arrayBuf = await downloadRes.arrayBuffer();
      const zipBuffer = Buffer.from(arrayBuf);

      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      // Look for database.json
      const dbEntry = zipEntries.find(e => e.entryName === 'database.json');
      if (!dbEntry) {
        return res.status(400).json({ error: 'Invalid backup package in Google Drive. Missing database.json.' });
      }

      const databaseContent = dbEntry.getData().toString('utf8');
      const backupData = JSON.parse(databaseContent);

      if (!backupData.tables) {
        return res.status(400).json({ error: 'Invalid backup format in database.json.' });
      }

      // Extract media binaries to /uploads
      let restoredMediaFiles = 0;
      for (const entry of zipEntries) {
        if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
          const fileName = path.basename(entry.entryName);
          const targetPath = path.join(uploadsDir, fileName);
          fs.writeFileSync(targetPath, entry.getData());
          restoredMediaFiles++;
        }
      }

      // Restore SQLite tables
      const { tables } = backupData;
      let totalRecordsRestored = 0;

      if (tables.site_config) {
        await db.run('DELETE FROM site_config');
        for (const item of tables.site_config) {
          await db.run('INSERT INTO site_config (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.submissions) {
        await db.run('DELETE FROM submissions');
        for (const item of tables.submissions) {
          await db.run('INSERT INTO submissions (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.events) {
        await db.run('DELETE FROM events');
        for (const item of tables.events) {
          await db.run('INSERT INTO events (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.gallery) {
        await db.run('DELETE FROM gallery');
        for (const item of tables.gallery) {
          await db.run('INSERT INTO gallery (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.hotels) {
        await db.run('DELETE FROM hotels');
        for (const item of tables.hotels) {
          await db.run('INSERT INTO hotels (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.passes) {
        await db.run('DELETE FROM passes');
        for (const item of tables.passes) {
          await db.run('INSERT INTO passes (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.testimonials) {
        await db.run('DELETE FROM testimonials');
        for (const item of tables.testimonials) {
          await db.run('INSERT INTO testimonials (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }
      if (tables.media) {
        await db.run('DELETE FROM media');
        for (const item of tables.media) {
          await db.run('INSERT INTO media (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
          totalRecordsRestored++;
        }
      }

      broadcast('system_restored');

      res.json({
        success: true,
        message: 'System restored successfully from Google Drive backup.',
        summary: {
          totalRecordsRestored,
          restoredMediaFiles,
          systemVersion: backupData.version || '2027.1.0'
        }
      });
    } catch (e: any) {
      console.error('[GDRIVE RESTORE ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a backup from Google Drive
  app.delete('/api/admin/backup/drive/file/:fileId', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
      }
      const token = authHeader.split(' ')[1];
      const { fileId } = req.params;

      const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!delRes.ok) {
        const errText = await delRes.text();
        return res.status(delRes.status).json({ error: 'Failed to delete from Google Drive: ' + errText });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Background Automatic Backup Scheduler Loop
  function startAutomaticBackupScheduler() {
    console.log('[SYSTEM CONFIG] Starting background auto-backup scheduler...');
    
    setInterval(async () => {
      try {
        const intervalRow = await db.get("SELECT value FROM system_meta WHERE key = 'backup_interval_hours'");
        if (!intervalRow) return;
        
        const intervalHours = parseFloat(intervalRow.value);
        if (intervalHours <= 0) return; // Scheduler is disabled
        
        const lastRow = await db.get("SELECT value FROM system_meta WHERE key = 'last_backup_time'");
        let lastBackupTime = lastRow ? new Date(lastRow.value).getTime() : Date.now();
        
        if (!lastRow) {
          await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('last_backup_time', ?)", new Date().toISOString());
          return;
        }
        
        const intervalMs = intervalHours * 60 * 60 * 1000;
        const now = Date.now();
        
        if (now - lastBackupTime >= intervalMs) {
          console.log(`[AUTO BACKUP] Auto-backup interval elapsed (${intervalHours}h). Executing automatic backup...`);
          
          let label = `Auto-Backup (${intervalHours}h)`;
          if (intervalHours < 1) {
            const mins = Math.round(intervalHours * 60);
            label = `Auto-Backup (${mins}m)`;
          } else if (intervalHours >= 24 && intervalHours % 24 === 0) {
            label = `Auto-Backup (${intervalHours / 24}d)`;
          }
          
          const filename = await createSystemBackupSnapshot(label);
          console.log(`[AUTO BACKUP] Automatically created backup snapshot: ${filename}`);
          
          await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('last_backup_time', ?)", new Date().toISOString());
          
          // Broadcast to connected admin tabs to refresh state
          broadcast('snapshots');
          broadcast('backup_schedule_updated');
        }
      } catch (err) {
        console.error('[AUTO BACKUP ERROR] Failed in automatic backup scheduler check:', err);
      }
    }, 20000); // Check database every 20 seconds
  }

  // Start background daemon
  startAutomaticBackupScheduler();

  // Factory reset to initial default dataset and restart server
  app.post('/api/admin/backup/factory-reset', async (req, res) => {
    try {
      await db.run('DELETE FROM site_config');
      await db.run('DELETE FROM submissions');
      await db.run('DELETE FROM events');
      await db.run('DELETE FROM gallery');
      await db.run('DELETE FROM hotels');
      await db.run('DELETE FROM passes');
      await db.run('DELETE FROM testimonials');
      await db.run('DELETE FROM media');

      // Seed baseline
      await db.run('INSERT INTO site_config (id, data_json) VALUES (?, ?)', 'main', JSON.stringify(DEFAULT_SITE_CONFIG));
      for (const item of INITIAL_DEMO_SUBMISSIONS) {
        await db.run('INSERT INTO submissions (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of FESTIVAL_EVENTS) {
        await db.run('INSERT INTO events (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of GALLERY_ITEMS) {
        await db.run('INSERT INTO gallery (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of FESTIVAL_HOTELS) {
        await db.run('INSERT INTO hotels (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of FESTIVAL_PASSES) {
        await db.run('INSERT INTO passes (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of FESTIVAL_TESTIMONIALS) {
        await db.run('INSERT INTO testimonials (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }
      for (const item of INITIAL_DEMO_MEDIA) {
        await db.run('INSERT INTO media (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
      }

      broadcast('system_restored');

      res.json({
        success: true,
        message: 'Factory reset completed successfully.',
        restored: true
      });

    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware setup for Development, otherwise serve static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL SERVER ERROR]', err);
});
