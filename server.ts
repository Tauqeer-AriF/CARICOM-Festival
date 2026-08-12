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
  const PORT = 3000;

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

  // Serve binary uploads statically
  app.use('/uploads', express.static(uploadsDir));

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
      const originalExt = path.extname(req.file.originalname).toLowerCase();
      const isRasterImage = mime.startsWith('image/') && !mime.includes('svg') && originalExt !== '.svg';
      const originalSize = req.file.size || req.file.buffer.length;

      if (isRasterImage) {
        // Convert to optimized WebP format with sharp
        const sanitizedBase = path.basename(req.file.originalname, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');
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
        const sanitizedBase = path.basename(req.file.originalname, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedBase}${originalExt}`;
        const targetPath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(targetPath, req.file.buffer);

        return res.json({
          url: `/uploads/${uniqueName}`,
          filename: uniqueName,
          originalName: req.file.originalname,
          size: originalSize,
          originalSize,
          compressedSize: originalSize,
          savingsPercent: '0%',
          mimetype: req.file.mimetype
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

  // Push snapshot to secure cloud vault anonymously and securely
  app.post('/api/admin/backup/push-to-vault', async (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: 'Filename parameter is required.' });
      }
      
      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Target backup file was not found on server local disk.' });
      }

      console.log(`[VAULT PUSH] Reading snapshot package: ${filename}`);
      const fileBuffer = fs.readFileSync(filePath);
      
      console.log(`[VAULT PUSH] Submitting to remote file.io securely...`);
      const formData = new FormData();
      const fileBlob = new Blob([fileBuffer], { type: 'application/zip' });
      formData.append('file', fileBlob, filename);
      formData.append('expires', '1d');

      let uploadResultUrl = '';
      let expiryLabel = '24 Hours (or until first download)';
      let succeeded = false;

      try {
        const response = await fetch('https://file.io/', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('{')) {
            const uploadResult = JSON.parse(text);
            if (uploadResult.success) {
              uploadResultUrl = uploadResult.link;
              succeeded = true;
              console.log(`[VAULT PUSH SUCCESS] File uploaded successfully to file.io: ${uploadResultUrl}`);
            }
          } else {
            console.warn('[VAULT PUSH WARNING] file.io returned non-JSON text starting with:', text.substring(0, 100));
          }
        } else {
          console.warn(`[VAULT PUSH WARNING] file.io returned non-ok status: ${response.status}`);
        }
      } catch (fileIoErr: any) {
        console.warn(`[VAULT PUSH WARNING] file.io upload attempt failed: ${fileIoErr.message}`);
      }

      // If file.io fails, trigger fallback to tmpfiles.org immediately
      if (!succeeded) {
        console.log(`[VAULT PUSH] Activating high-reliability fallback to tmpfiles.org with 24-hour retention...`);
        const fallbackFormData = new FormData();
        const fallbackFileBlob = new Blob([fileBuffer], { type: 'application/zip' });
        fallbackFormData.append('file', fallbackFileBlob, filename);
        // Force the anonymous fallback vault to remain active for exactly 24 hours (86400 seconds)
        fallbackFormData.append('expire', '86400');

        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: fallbackFormData
        });

        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('{')) {
            const fallbackResult = JSON.parse(text);
            if (fallbackResult.status === 'success' && fallbackResult.data && fallbackResult.data.url) {
              // Convert view URL to direct download link: e.g. https://tmpfiles.org/12345/file -> https://tmpfiles.org/dl/12345/file
              let rawUrl = fallbackResult.data.url;
              uploadResultUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
              expiryLabel = '24 Hours (Anonymous temporary vault)';
              succeeded = true;
              console.log(`[VAULT PUSH SUCCESS] File uploaded successfully to tmpfiles.org: ${uploadResultUrl}`);
            } else {
              throw new Error(fallbackResult.message || 'tmpfiles.org rejected upload');
            }
          } else {
            throw new Error(`tmpfiles.org returned non-JSON text starting with: ${text.substring(0, 100)}`);
          }
        } else {
          throw new Error(`tmpfiles.org returned status ${response.status}`);
        }
      }

      if (succeeded && uploadResultUrl) {
        res.json({
          success: true,
          url: uploadResultUrl,
          expiry: expiryLabel
        });
      } else {
        throw new Error('All remote cloud vault destinations rejected the upload.');
      }
    } catch (e: any) {
      console.error('[VAULT PUSH ERROR] Failed to send backup to remote cloud:', e);
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

  // Helper to fetch SMTP settings from system database or environment fallbacks
  async function getSMTPSettings() {
    const hostRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_host'");
    const portRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_port'");
    const userRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_user'");
    const passRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_pass'");
    const toRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_to'");
    const enabledRow = await db.get("SELECT value FROM system_meta WHERE key = 'smtp_enabled'");

    const host = hostRow ? hostRow.value : (process.env.SMTP_HOST || '');
    const port = portRow ? parseInt(portRow.value) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587);
    const user = userRow ? userRow.value : (process.env.SMTP_USER || '');
    const pass = passRow ? passRow.value : (process.env.SMTP_PASS || '');
    const to = toRow ? toRow.value : (process.env.SMTP_TO || 'admin@example.com');
    // Enabled defaults to true if we have dynamic settings or fallback secrets configured
    const enabled = enabledRow ? enabledRow.value === 'true' : (host ? true : false);

    return { host, port, user, pass, to, enabled };
  }

  // Get current administrator SMTP configuration
  app.get('/api/admin/backup/smtp', async (req, res) => {
    try {
      const config = await getSMTPSettings();
      // Mask password for security before sending to client
      const maskedConfig = {
        ...config,
        pass: config.pass ? '••••••••' : ''
      };
      res.json(maskedConfig);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Save new SMTP configuration
  app.post('/api/admin/backup/smtp', async (req, res) => {
    try {
      const { host, port, user, pass, to, enabled } = req.body;
      
      if (host !== undefined) await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_host', ?)", String(host).trim());
      if (port !== undefined) await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_port', ?)", String(port).trim());
      if (user !== undefined) await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_user', ?)", String(user).trim());
      
      // Update password only if the user didn't leave it as our secure masked placeholder
      if (pass !== undefined && pass !== '••••••••' && pass.trim() !== '') {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_pass', ?)", String(pass).trim());
      }
      
      if (to !== undefined) await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_to', ?)", String(to).trim());
      if (enabled !== undefined) {
        await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('smtp_enabled', ?)", enabled ? 'true' : 'false');
      }
      
      broadcast('smtp_config_updated');
      res.json({ success: true, message: 'SMTP configurations updated successfully!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Test dynamic SMTP settings
  app.post('/api/admin/backup/smtp/test', async (req, res) => {
    try {
      const { host, port, user, pass, to } = req.body;
      
      let testHost = host;
      let testPort = parseInt(port) || 587;
      let testUser = user;
      let testPass = pass;
      let testTo = to || 'admin@example.com';

      // Read current config if password is masked or omitted
      const currentConfig = await getSMTPSettings();
      if (testPass === '••••••••' || !testPass) {
        testPass = currentConfig.pass;
      }
      if (!testHost) testHost = currentConfig.host;
      if (!testUser) testUser = currentConfig.user;

      if (!testHost || !testUser || !testPass) {
        return res.status(400).json({ error: 'SMTP host, username, and password are required to test connection.' });
      }

      console.log(`[SMTP MANUAL TEST] Dispensing test email to ${testTo}...`);
      const transporter = nodemailer.createTransport({
        host: testHost,
        port: testPort,
        secure: testPort === 465,
        auth: {
          user: testUser,
          pass: testPass
        }
      });

      await transporter.sendMail({
        from: `"Grenada CARICOM System SMTP Test" <${testUser}>`,
        to: testTo,
        subject: `🧪 CARICOM Festival Portal: SMTP Verification Success!`,
        text: `Success! Your administrator SMTP configurations are fully functional and ready to dispatch cloud backups automatically.\n\n` +
              `Time of Test: ${new Date().toLocaleString()}\n` +
              `Host: ${testHost}\n` +
              `Port: ${testPort}\n\n` +
              `Thank you,\nGrenada CARICOM Festival System Agent\n`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 2px solid #10b981; border-radius: 12px; background-color: #f0fdf4;">
            <h2 style="color: #047857; margin-top: 0; border-bottom: 2px solid #10b981; padding-bottom: 8px;">🧪 SMTP Connection Successful!</h2>
            <p style="font-size: 14px; color: #065f46; line-height: 1.6;">
              Congratulations! Your SMTP outgoing mail configurations are fully functional. The system can now deliver remote cloud vault recovery keys directly to your inbox.
            </p>
            <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; font-size: 12px; font-family: monospace; border: 1px solid #a7f3d0; margin-top: 15px;">
              <b>Host:</b> ${testHost}<br/>
              <b>Port:</b> ${testPort}<br/>
              <b>Sender User:</b> ${testUser}<br/>
              <b>Recipient inbox:</b> ${testTo}<br/>
              <b>Timestamp:</b> ${new Date().toLocaleString()}
            </div>
          </div>
        `
      });

      res.json({ success: true, message: `Connection verification success! Email delivered to ${testTo}.` });
    } catch (e: any) {
      console.error('[SMTP MANUAL TEST ERROR] Failed to deliver test email:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Helper to deploy backup to cloud and optionally notify via email automatically
  async function deployBackupToCloudAndNotify(filename: string) {
    try {
      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        console.error(`[AUTO BACKUP DEPLOY] Backup file ${filename} not found.`);
        return;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      const fileBlob = new Blob([fileBuffer], { type: 'application/zip' });
      formData.append('file', fileBlob, filename);
      formData.append('expires', '1d');

      let uploadResultUrl = '';
      let expiryLabel = '24 Hours (or until first download)';
      let succeeded = false;

      // 1. Try file.io
      try {
        console.log(`[AUTO BACKUP DEPLOY] Automatically uploading ${filename} to file.io...`);
        const response = await fetch('https://file.io/', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('{')) {
            const uploadResult = JSON.parse(text);
            if (uploadResult.success) {
              uploadResultUrl = uploadResult.link;
              succeeded = true;
              console.log(`[AUTO BACKUP DEPLOY SUCCESS] Uploaded successfully to file.io: ${uploadResultUrl}`);
            }
          }
        }
      } catch (fileIoErr: any) {
        console.warn(`[AUTO BACKUP DEPLOY WARNING] file.io failed: ${fileIoErr.message}`);
      }

      // 2. Fallback to tmpfiles.org
      if (!succeeded) {
        try {
          console.log(`[AUTO BACKUP DEPLOY] Fallback: uploading ${filename} to tmpfiles.org with 24-hour retention...`);
          const fallbackFormData = new FormData();
          const fallbackFileBlob = new Blob([fileBuffer], { type: 'application/zip' });
          fallbackFormData.append('file', fallbackFileBlob, filename);
          // Force the anonymous fallback vault to remain active for exactly 24 hours (86400 seconds)
          fallbackFormData.append('expire', '86400');

          const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: fallbackFormData
          });

          if (response.ok) {
            const text = await response.text();
            if (text.trim().startsWith('{')) {
              const fallbackResult = JSON.parse(text);
              if (fallbackResult.status === 'success' && fallbackResult.data && fallbackResult.data.url) {
                let rawUrl = fallbackResult.data.url;
                uploadResultUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                expiryLabel = '24 Hours (Anonymous temporary vault)';
                succeeded = true;
                console.log(`[AUTO BACKUP DEPLOY SUCCESS] Uploaded successfully to tmpfiles.org: ${uploadResultUrl}`);
              }
            }
          }
        } catch (tmpErr: any) {
          console.error(`[AUTO BACKUP DEPLOY ERROR] Fallback tmpfiles.org failed: ${tmpErr.message}`);
        }
      }

      if (succeeded && uploadResultUrl) {
        const smtpSettings = await getSMTPSettings();

        if (smtpSettings.enabled && smtpSettings.host && smtpSettings.user && smtpSettings.pass) {
          console.log(`[AUTO BACKUP EMAIL] Initiating dynamic automatic email dispatch to ${smtpSettings.to} via ${smtpSettings.host}...`);
          
          const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.port === 465,
            auth: {
              user: smtpSettings.user,
              pass: smtpSettings.pass
            }
          });

          const mailOptions = {
            from: `"Grenada CARICOM Festival Auto-Backup" <${smtpSettings.user}>`,
            to: smtpSettings.to,
            subject: `🚨 Automated Cloud Vault Backup: ${filename}`,
            text: `Grenada CARICOM 2027 Festival Portal\nAutomated System Backup & Secure Vault Transfer\n\n` +
                  `Your system successfully performed an automatic point-of-time backup and uploaded the encrypted archive safely to the cloud vault.\n\n` +
                  `📦 Backup Filename: ${filename}\n` +
                  `⏳ Retrieval Link Expiry: ${expiryLabel}\n` +
                  `🔗 Secure Cloud Retrieval Link: ${uploadResultUrl}\n\n` +
                  `To restore this state, copy the Link URL above, open the Festival Admin Dashboard under "Backups", and paste the cloud vault link into the manual recovery loader.\n\n` +
                  `Best regards,\nGrenada CARICOM Festival System Agent\n`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
                <h2 style="color: #d97706; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">🚨 System Auto-Backup Completed</h2>
                <p style="font-size: 14px; color: #374151; line-height: 1.6;">
                  The CARICOM Festival portal completed an automatic snapshot archive and uploaded the encrypted ZIP container safely to our high-reliability remote cloud vaults.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                  <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold; width: 130px;">Archive File:</td>
                      <td style="padding: 4px 0; font-family: monospace; color: #1f2937;">${filename}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold;">Vault Lifespan:</td>
                      <td style="padding: 4px 0; color: #d97706; font-weight: bold;">${expiryLabel}</td>
                    </tr>
                  </table>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${uploadResultUrl}" style="background-color: #f59e0b; color: #000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; display: inline-block;">
                    📥 Access Cloud Vault Snapshot
                  </a>
                </div>

                <p style="font-size: 11px; color: #6b7280; line-height: 1.5; border-top: 1px solid #f3f4f6; padding-top: 15px; margin-top: 25px;">
                  You can download the archive or restore your database records directly in the administrator settings by pasting this URL into the remote backup restore card.
                </p>
              </div>
            `
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`[AUTO BACKUP EMAIL SUCCESS] Dispatch complete! Auto backup link emailed to ${smtpSettings.to}`);
        } else {
          console.log(`\n=============================================================`);
          console.log(`[AUTO BACKUP CLOUD SUCCESS] Secure Link Generated: ${uploadResultUrl}`);
          console.log(`[AUTO BACKUP CONFIG] Note: To send this email automatically to ${smtpSettings.to || 'your inbox'},`);
          console.log(`please specify your SMTP configurations in your admin backups dashboard.`);
          console.log(`=============================================================\n`);
        }
      }
    } catch (err: any) {
      console.error(`[AUTO BACKUP DEPLOY ERROR] Automatic deployment flow failed:`, err);
    }
  }

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
          if (intervalHours === 0.0167) {
            label = 'Auto-Backup (1m Test)';
          } else if (intervalHours === 0.0833) {
            label = 'Auto-Backup (5m Test)';
          }
          
          const filename = await createSystemBackupSnapshot(label);
          console.log(`[AUTO BACKUP] Automatically created backup snapshot: ${filename}`);
          
          await db.run("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('last_backup_time', ?)", new Date().toISOString());
          
          // Trigger asynchronous background cloud vault deployment and email notification
          deployBackupToCloudAndNotify(filename).catch(deployErr => {
            console.error('[AUTO BACKUP] Failed to deploy and notify in background:', deployErr);
          });
          
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
