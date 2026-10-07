import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

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
// GEMINI AI PORTFOLIO CHATBOT
// Live synced with Firestore portfolio changes
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Build fresh knowledge base directly from live Firestore state
async function getLivePortfolioContext() {
  let profileData: any = null;
  const projectsData: any[] = [];
  const expData: any[] = [];
  const skillsData: any[] = [];
  const eduData: any[] = [];

  if (db) {
    try {
      const pSnap = await getDoc(doc(db, 'site_content', 'main_profile'));
      if (pSnap.exists()) profileData = pSnap.data();
    } catch (e) {
      console.warn('Error reading live profile for AI:', e);
    }

    try {
      const prSnap = await getDocs(collection(db, 'projects'));
      prSnap.forEach(d => {
        const item = d.data();
        if (item) projectsData.push(item);
      });
      projectsData.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    } catch (e) {
      console.warn('Error reading live projects for AI:', e);
    }

    try {
      const eSnap = await getDocs(collection(db, 'experiences'));
      eSnap.forEach(d => expData.push(d.data()));
    } catch (e) {
      console.warn('Error reading live experiences for AI:', e);
    }

    try {
      const sSnap = await getDocs(collection(db, 'skills'));
      sSnap.forEach(d => skillsData.push(d.data()));
    } catch (e) {
      console.warn('Error reading live skills for AI:', e);
    }

    try {
      const edSnap = await getDocs(collection(db, 'education'));
      edSnap.forEach(d => eduData.push(d.data()));
    } catch (e) {
      console.warn('Error reading live education for AI:', e);
    }
  }

  let context = `=== RAJ PANDYA: EXECUTIVE PRODUCT MANAGER & GROWTH LEADER ===\n`;
  if (profileData) {
    context += `Name: ${profileData.name || 'Raj Pandya'}\n`;
    context += `Headline: ${profileData.headline || ''}\n`;
    context += `Title: ${profileData.title || ''}\n`;
    context += `Bio / Summary: ${profileData.summary || ''}\n`;
    context += `Email: ${profileData.email || 'gpl.raj@firsteconomy.com'}\n`;
    context += `Phone: ${profileData.phone || ''}\n`;
    context += `Location: ${profileData.location || ''}\n`;
    if (profileData.socialLinks) {
      context += `Social Links: LinkedIn (${profileData.socialLinks.linkedin || ''}), GitHub (${profileData.socialLinks.github || ''}), Twitter (${profileData.socialLinks.twitter || ''})\n`;
    }
    if (profileData.resumeUrl) {
      context += `Resume Link: Available on portfolio\n`;
    }
    if (profileData.metrics?.length) {
      context += `Featured Profile Metrics:\n`;
      profileData.metrics.forEach((m: any) => {
        context += `- ${m.label}: ${m.value} (${m.sub || ''})\n`;
      });
    }
    if (profileData.pillars?.length) {
      context += `Core Strategic Pillars:\n`;
      profileData.pillars.forEach((p: any) => {
        context += `- ${p.title} [${p.category}]: ${p.description}\n`;
      });
    }
  }

  context += `\n=== PROJECTS & CASE STUDIES (${projectsData.length} Total) ===\n`;
  projectsData.forEach((p: any, idx: number) => {
    context += `\n[Project ${idx + 1}: ${p.title}]\n`;
    context += `Subtitle: ${p.subtitle || ''}\n`;
    context += `Category: ${p.category || ''} | Status: ${p.status || 'Published'} | Role: ${p.role || ''} | Period: ${p.period || ''}\n`;
    if (p.impact) context += `Impact Summary: ${p.impact}\n`;
    if (p.metrics?.length) {
      context += `Key Metrics / Measured Results:\n`;
      p.metrics.forEach((m: any) => context += `  * ${m.label}: ${m.value} - ${m.detail || ''}\n`);
    }
    if (p.problem) context += `Problem: ${p.problem}\n`;
    if (p.objectives) context += `Objectives: ${p.objectives}\n`;
    if (p.userResearch) context += `User Research: ${p.userResearch}\n`;
    if (p.targetAudience) context += `Target Audience: ${p.targetAudience}\n`;
    if (p.painPoints) context += `Pain Points: ${p.painPoints}\n`;
    if (p.strategy) context += `Product Strategy: ${p.strategy}\n`;
    if (p.solution) context += `Solution Delivered: ${p.solution}\n`;
    if (p.experimentation) context += `Experimentation & A/B Testing: ${p.experimentation}\n`;
    if (p.outcome) context += `Measurable Outcome: ${p.outcome}\n`;
    if (p.learnings) context += `Retrospective Learnings: ${p.learnings}\n`;
    if (p.links?.length) {
      context += `Artifact Links:\n`;
      p.links.forEach((l: any) => context += `  * ${l.type} - ${l.label}: ${l.url}\n`);
    }
  });

  context += `\n=== CAREER EXPERIENCE (${expData.length} Roles) ===\n`;
  expData.forEach((e: any) => {
    context += `\n- Company: ${e.company}\n  Role: ${e.role}\n  Period: ${e.period}\n  Location: ${e.location || ''}\n  Summary: ${e.description || ''}\n`;
    if (e.achievements?.length) {
      context += `  Key Achievements:\n`;
      e.achievements.forEach((a: string) => context += `    * ${a}\n`);
    }
  });

  context += `\n=== SKILLS & CAPABILITIES (${skillsData.length} Categories) ===\n`;
  skillsData.forEach((s: any) => {
    context += `- ${s.name}: ${(s.skills || []).join(', ')} (${s.description || ''})\n`;
  });

  context += `\n=== EDUCATION (${eduData.length} Entries) ===\n`;
  eduData.forEach((ed: any) => {
    context += `- ${ed.degree} at ${ed.institution} (${ed.period}) - Score: ${ed.score || 'First Class'}. Details: ${ed.details || ''}\n`;
  });

  return context;
}

// Multi-Turn Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentPath } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    // Pull authoritative live data from Firestore
    const liveContext = await getLivePortfolioContext();

    const systemInstruction = `You are the official AI Assistant for Raj Pandya's Executive Product Management, Growth & AI Portfolio.
Your goal is to represent Raj Pandya accurately, eloquently, and knowledgeably to recruiters, hiring managers, founders, collaborators, and visitors.

AUTHORITATIVE LIVE KNOWLEDGE BASE (SYNCED IN REAL-TIME WITH RAJ'S FIRESTORE DATABASE):
${liveContext}

CRITICAL RULES:
1. STRICT ADHERENCE TO PORTFOLIO FACTS: Only answer using facts, achievements, metrics, frameworks, and roles stated in Raj's live portfolio above. Do NOT make up, extrapolate, or hallucinate credentials or work experience.
2. PROFESSIONAL TONE: Speak with the clear, structured clarity of a senior Principal Product Manager / Growth Lead. Use crisp bullet points, bold quantifiable metrics (e.g. +24% conversion lift, ₹180M GMV, 14-day cycle time reduction), and structured takeaways where suitable.
3. CONTEXT AWARENESS: The user is currently browsing "${currentPath || '/'}". If they ask about what is on this page or ask questions, orient your answer relevantly to this context.
4. OUT-OF-SCOPE QUESTIONS: If asked about topics completely unrelated to Raj Pandya's career, portfolio, product management, or technology, or if asked something not documented in his portfolio, politely state what is known from Raj's portfolio and invite them to connect directly with Raj.
5. SUGGESTED QUESTIONS: At the VERY END of EVERY response, output exactly 2 or 3 compelling, short follow-up questions that the user would naturally want to ask next, prefixed exactly with:
SUGGESTED_QUESTIONS: [Question 1] | [Question 2] | [Question 3]`;

    // Map conversation turns to Gemini API format
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '') }]
    }));

    // Call Gemini API with fast and robust fallback
    let responseText = '';
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const genResponse = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95
          }
        });
        if (genResponse && genResponse.text) {
          responseText = genResponse.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${modelName} notice:`, err.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response generated by AI model');
    }

    // Extract suggested questions from response
    let reply = responseText;
    let suggestedQuestions: string[] = [];

    const marker = 'SUGGESTED_QUESTIONS:';
    const markerIndex = reply.lastIndexOf(marker);
    if (markerIndex !== -1) {
      const rawSuggestions = reply.substring(markerIndex + marker.length).trim();
      reply = reply.substring(0, markerIndex).trim();
      suggestedQuestions = rawSuggestions
        .split('|')
        .map(q => q.trim().replace(/^[-*•\d.]+\s*/, '').replace(/^[?"']+|[?"']+$/g, ''))
        .filter(q => q.length > 5 && q.length < 120);
    }

    if (suggestedQuestions.length === 0) {
      suggestedQuestions = [
        "Tell me about the Godrej Properties case study",
        "What are Raj's key metrics & results?",
        "How can I get in touch with Raj?"
      ];
    }

    res.json({
      success: true,
      reply,
      suggestedQuestions
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate AI response'
    });
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
