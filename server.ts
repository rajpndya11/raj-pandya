import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const app = express();
// Runtime Environment requires Express to run on Port 3000 behind Nginx (port 8080)
const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? Number(process.argv[portArgIdx + 1]) : null;
const PORT = cliPort || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support generous payload size for document base64 data and image assets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS and Preflight headers for all endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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

// Ensure public/uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==========================================
// RESUME UPLOAD & DOWNLOAD API
// ==========================================

// Dedicated Resume Download with proper Content-Disposition header
app.get('/api/resume/download', async (req, res) => {
  try {
    let candidatePath = path.resolve(process.cwd(), 'public', 'Raj_Pandya_Product_Manager_Resume.pdf');
    let downloadFileName = 'Raj_Pandya_Product_Manager_Resume.pdf';

    if (db) {
      try {
        const docSnap = await getDoc(doc(db, 'site_content', 'main_profile'));
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          if (profileData?.resumeUrl) {
            const resumeUrl = String(profileData.resumeUrl).trim();
            if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
              return res.redirect(resumeUrl);
            }
            const cleanRel = resumeUrl.replace(/^\//, '');
            const targetPath = path.resolve(process.cwd(), 'public', cleanRel);
            if (fs.existsSync(targetPath)) {
              candidatePath = targetPath;
              downloadFileName = path.basename(targetPath);
            }
          }
        }
      } catch (err) {
        console.warn('Resume download profile lookup notice:', err);
      }
    }

    if (fs.existsSync(candidatePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      return res.sendFile(candidatePath);
    }
    return res.status(404).json({ success: false, error: 'Resume PDF not found on server' });
  } catch (err: any) {
    console.error('Error in /api/resume/download:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backend Resume Upload Endpoint
app.post('/api/upload/resume', async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Missing fileData payload' });
    }

    // Extract base64 payload
    const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64Content, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded file buffer is empty' });
    }

    // Generate safe filename with timestamp
    const originalName = fileName || 'Raj_Pandya_Product_Manager_Resume.pdf';
    const ext = path.extname(originalName) || '.pdf';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFileName = `${baseName}_${Date.now()}${ext}`;

    const filePath = path.join(uploadsDir, targetFileName);
    fs.writeFileSync(filePath, buffer);

    // Also overwrite default public/Raj_Pandya_Product_Manager_Resume.pdf so standard links update instantly
    if (ext.toLowerCase() === '.pdf') {
      try {
        fs.writeFileSync(path.resolve(process.cwd(), 'public', 'Raj_Pandya_Product_Manager_Resume.pdf'), buffer);
      } catch (copyErr) {
        console.warn('Could not overwrite default resume file:', copyErr);
      }
    }

    const publicUrl = `/uploads/${targetFileName}`;

    // Update Firestore main_profile document directly on server
    if (db) {
      try {
        await setDoc(doc(db, 'site_content', 'main_profile'), {
          resumeUrl: publicUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Track in media_assets collection
        const mediaId = `media-resume-${Date.now()}`;
        await setDoc(doc(db, 'media_assets', mediaId), {
          id: mediaId,
          name: originalName,
          url: publicUrl,
          type: mimeType || 'application/pdf',
          size: buffer.length,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore update on resume upload notice:', dbErr);
      }
    }

    console.log(`✓ Resume uploaded successfully to ${publicUrl} (${buffer.length} bytes)`);

    res.json({
      success: true,
      url: publicUrl,
      fileName: targetFileName,
      originalName,
      size: buffer.length,
      message: 'Resume uploaded and saved to backend successfully'
    });
  } catch (err: any) {
    console.error('API /api/upload/resume error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// General File Upload Endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { fileName, fileData, mimeType, category } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Missing fileData payload' });
    }

    const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64Content, 'base64');

    const originalName = fileName || `asset_${Date.now()}`;
    const ext = path.extname(originalName) || '';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFileName = `${baseName}_${Date.now()}${ext}`;

    const filePath = path.join(uploadsDir, targetFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${targetFileName}`;

    if (db) {
      try {
        const mediaId = `media-${Date.now()}`;
        await setDoc(doc(db, 'media_assets', mediaId), {
          id: mediaId,
          name: originalName,
          url: publicUrl,
          type: mimeType || 'application/octet-stream',
          category: category || 'general',
          size: buffer.length,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore media_assets notice on upload:', dbErr);
      }
    }

    res.json({
      success: true,
      url: publicUrl,
      fileName: targetFileName,
      size: buffer.length,
      message: 'File uploaded successfully'
    });
  } catch (err: any) {
    console.error('API /api/upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// VITE SPA & STATIC SERVING
// ==========================================

async function startServer() {
  // Serve static assets from public directory (PDFs, icons, images)
  const publicPath = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicPath));

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
