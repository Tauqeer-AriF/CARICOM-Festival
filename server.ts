import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
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
        // Seed DEFAULT_SITE_CONFIG
        const seedConfig = { ...DEFAULT_SITE_CONFIG, updatedAt: new Date().toISOString() };
        await db.run('INSERT INTO site_config (id, data_json) VALUES (?, ?)', 'main', JSON.stringify(seedConfig));
        return res.json(seedConfig);
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
      if (rows.length === 0) {
        // Seed default submissions
        for (const sub of INITIAL_DEMO_SUBMISSIONS) {
          await db.run('INSERT INTO submissions (id, data_json) VALUES (?, ?)', sub.id, JSON.stringify(sub));
        }
        return res.json(INITIAL_DEMO_SUBMISSIONS);
      }
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
      if (rows.length === 0) {
        // Seed
        for (const item of FESTIVAL_EVENTS) {
          await db.run('INSERT INTO events (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        return res.json(FESTIVAL_EVENTS);
      }
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
      if (rows.length === 0) {
        for (const item of GALLERY_ITEMS) {
          await db.run('INSERT INTO gallery (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        return res.json(GALLERY_ITEMS);
      }
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
      if (rows.length === 0) {
        for (const item of FESTIVAL_HOTELS) {
          await db.run('INSERT INTO hotels (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        return res.json(FESTIVAL_HOTELS);
      }
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
      if (rows.length === 0) {
        for (const item of FESTIVAL_PASSES) {
          await db.run('INSERT INTO passes (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        return res.json(FESTIVAL_PASSES);
      }
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
      if (rows.length === 0) {
        for (const item of FESTIVAL_TESTIMONIALS) {
          await db.run('INSERT INTO testimonials (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        return res.json(FESTIVAL_TESTIMONIALS);
      }
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
      if (rows.length === 0) {
        for (const item of INITIAL_DEMO_MEDIA) {
          await db.run('INSERT INTO media (id, data_json) VALUES (?, ?)', item.id, JSON.stringify(item));
        }
        const sortedSeed = [...INITIAL_DEMO_MEDIA].sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
        return res.json(sortedSeed);
      }
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

  // Create on-demand manual server snapshot
  app.post('/api/admin/backup/create-snapshot', async (req, res) => {
    try {
      const { label } = req.body;
      const siteConfigRows = await db.all('SELECT * FROM site_config');
      const submissionsRows = await db.all('SELECT * FROM submissions');
      const eventsRows = await db.all('SELECT * FROM events');
      const galleryRows = await db.all('SELECT * FROM gallery');
      const hotelsRows = await db.all('SELECT * FROM hotels');
      const passesRows = await db.all('SELECT * FROM passes');
      const testimonialsRows = await db.all('SELECT * FROM testimonials');
      const mediaRows = await db.all('SELECT * FROM media');

      const parseRows = (rows: any[]) => rows.map(r => JSON.parse(r.data_json));

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

      const snapshot = {
        version: '2027.1.0',
        system: label ? `Manual Snapshot: ${label}` : 'Manual Admin Snapshot',
        exportedAt: new Date().toISOString(),
        summary: { totalRecords, mediaFilesCount },
        tables
      };

      const sanitizedLabel = (label || 'manual').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const zip = new AdmZip();
      zip.addFile('database.json', Buffer.from(JSON.stringify(snapshot, null, 2)));
      zip.addFile('manifest.json', Buffer.from(JSON.stringify({
        version: '2027.1.0',
        exportedAt: new Date().toISOString(),
        totalRecords,
        mediaFilesCount,
        label
      }, null, 2)));

      if (fs.existsSync(uploadsDir)) {
        for (const filename of uploadFilesList) {
          zip.addLocalFile(path.join(uploadsDir, filename), 'uploads');
        }
      }

      const filename = `snapshot-${sanitizedLabel}-${Date.now()}.zip`;
      fs.writeFileSync(path.join(backupsDir, filename), zip.toBuffer());

      res.json({ success: true, filename });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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
