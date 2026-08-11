import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db/database';

// Import default/initial data to seed SQLite
import { DEFAULT_SITE_CONFIG, INITIAL_DEMO_SUBMISSIONS, INITIAL_DEMO_MEDIA } from './src/services/submissionService';
import { FESTIVAL_EVENTS, FESTIVAL_HOTELS, FESTIVAL_PASSES, FESTIVAL_TESTIMONIALS, FESTIVAL_IMAGES } from './src/data/festivalData';
import { GALLERY_ITEMS } from './src/data/galleryData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // Helper to get database connection
  const db = await getDb();

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
        await db.run('INSERT INTO site_config (id, data_json) VALUES (?, ?)', 'main', JSON.stringify(DEFAULT_SITE_CONFIG));
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
      let updated = false;
      for (const ev of events) {
        const matchingDefault = FESTIVAL_EVENTS.find(fe => fe.id === ev.id);
        if (matchingDefault && ev.highlightImage !== matchingDefault.highlightImage) {
          ev.highlightImage = matchingDefault.highlightImage;
          await db.run('UPDATE events SET data_json = ? WHERE id = ?', JSON.stringify(ev), ev.id);
          updated = true;
        }
      }
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
      let updated = false;
      for (const item of items) {
        const matchingDefault = GALLERY_ITEMS.find(gi => gi.id === item.id);
        if (matchingDefault && item.imageUrl !== matchingDefault.imageUrl) {
          item.imageUrl = matchingDefault.imageUrl;
          await db.run('UPDATE gallery SET data_json = ? WHERE id = ?', JSON.stringify(item), item.id);
          updated = true;
        }
      }
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
        return res.json(INITIAL_DEMO_MEDIA);
      }
      res.json(rows.map(r => JSON.parse(r.data_json)));
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

startServer();
