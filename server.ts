import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support generous payload size for document base64 data and image assets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize server-side Firestore connection
let db: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    try {
      db = initializeFirestore(firebaseApp, {
        ignoreUndefinedProperties: true
      }, firebaseConfig.firestoreDatabaseId);
    } catch {
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    }
    console.log('Server connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn('Server Firestore initialization notice:', err);
}

// Clean object helper
function cleanPayload(data: any): any {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => cleanPayload(item));
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = cleanPayload(value);
    }
  }
  return cleaned;
}

// ==========================================
// REST API ROUTES (/api/*)
// Allows backend changes to immediately reflect to frontend
// ==========================================

// Health / Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firestoreConnected: Boolean(db),
    environment: isProduction ? 'production' : 'development'
  });
});

// Profile: GET
app.get('/api/profile', async (req, res) => {
  try {
    if (db) {
      const docSnap = await getDoc(doc(db, 'site_content', 'main_profile'));
      if (docSnap.exists()) {
        return res.json({ success: true, data: docSnap.data(), source: 'firestore' });
      }
    }
    res.json({ success: true, data: null, source: 'fallback' });
  } catch (err: any) {
    console.error('API /api/profile GET error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile: PUT / POST
app.put('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
    if (!profileData) {
      return res.status(400).json({ success: false, error: 'Missing profile payload' });
    }
    const cleaned = cleanPayload({
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    if (db) {
      await setDoc(doc(db, 'site_content', 'main_profile'), cleaned, { merge: true });
    }
    res.json({ success: true, data: cleaned, message: 'Profile updated in backend' });
  } catch (err: any) {
    console.error('API /api/profile PUT error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Projects: GET all
app.get('/api/projects', async (req, res) => {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'projects'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        // Sort by order ascending
        list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        return res.json({ success: true, count: list.length, data: list, source: 'firestore' });
      }
    }
    res.json({ success: true, count: 0, data: [], source: 'fallback' });
  } catch (err: any) {
    console.error('API /api/projects GET error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Projects: GET single
app.get('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (db) {
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        return res.json({ success: true, data: docSnap.data() });
      }
    }
    res.status(404).json({ success: false, error: 'Project not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Projects: POST / PUT single project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const projectData = req.body;
    const cleaned = cleanPayload({
      ...projectData,
      id,
      updatedAt: new Date().toISOString()
    });
    if (db) {
      await setDoc(doc(db, 'projects', id), cleaned, { merge: true });
    }
    res.json({ success: true, data: cleaned, message: `Project ${id} saved in backend` });
  } catch (err: any) {
    console.error(`API /api/projects/${req.params.id} PUT error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Projects: DELETE single project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (db) {
      await deleteDoc(doc(db, 'projects', id));
    }
    res.json({ success: true, message: `Project ${id} deleted in backend` });
  } catch (err: any) {
    console.error(`API /api/projects/${req.params.id} DELETE error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Experiences: GET
app.get('/api/experiences', async (req, res) => {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'experiences'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        return res.json({ success: true, count: list.length, data: list });
      }
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Experiences: PUT
app.put('/api/experiences', async (req, res) => {
  try {
    const list = req.body;
    if (Array.isArray(list) && db) {
      for (const item of list) {
        if (item.id) {
          await setDoc(doc(db, 'experiences', item.id), cleanPayload(item), { merge: true });
        }
      }
    }
    res.json({ success: true, message: 'Experiences updated in backend' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Skills: GET
app.get('/api/skills', async (req, res) => {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'skills'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        return res.json({ success: true, count: list.length, data: list });
      }
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Skills: PUT
app.put('/api/skills', async (req, res) => {
  try {
    const list = req.body;
    if (Array.isArray(list) && db) {
      for (const item of list) {
        if (item.id) {
          await setDoc(doc(db, 'skills', item.id), cleanPayload(item), { merge: true });
        }
      }
    }
    res.json({ success: true, message: 'Skills updated in backend' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Education: GET
app.get('/api/education', async (req, res) => {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'education'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        return res.json({ success: true, count: list.length, data: list });
      }
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Education: PUT
app.put('/api/education', async (req, res) => {
  try {
    const list = req.body;
    if (Array.isArray(list) && db) {
      for (const item of list) {
        if (item.id) {
          await setDoc(doc(db, 'education', item.id), cleanPayload(item), { merge: true });
        }
      }
    }
    res.json({ success: true, message: 'Education updated in backend' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Media: GET
app.get('/api/media', async (req, res) => {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'media_assets'));
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        return res.json({ success: true, count: list.length, data: list });
      }
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Media: PUT / POST
app.put('/api/media/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const asset = req.body;
    if (db) {
      await setDoc(doc(db, 'media_assets', id), cleanPayload({ ...asset, id }), { merge: true });
    }
    res.json({ success: true, message: `Media ${id} updated in backend` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Media: DELETE
app.delete('/api/media/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (db) {
      await deleteDoc(doc(db, 'media_assets', id));
    }
    res.json({ success: true, message: `Media ${id} deleted in backend` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// VITE SPA & STATIC SERVING
// ==========================================

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware on Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist directory
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-Stack Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
