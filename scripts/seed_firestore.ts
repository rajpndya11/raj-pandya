import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, terminate } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { INITIAL_PROJECTS } from '../src/data/initialProjects';
import { INITIAL_PROFILE } from '../src/data/initialProfile';
import { INITIAL_EXPERIENCE, INITIAL_EDUCATION } from '../src/data/initialExperience';
import { SKILL_CATEGORIES } from '../src/data/skillsData';

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

async function seed() {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('Seeding Firestore database:', firebaseConfig.firestoreDatabaseId);

  // 1. Projects
  console.log('Checking projects...');
  for (let i = 0; i < INITIAL_PROJECTS.length; i++) {
    const proj = INITIAL_PROJECTS[i];
    const projDoc = doc(db, 'projects', proj.id);
    const existing = await getDoc(projDoc);
    if (!existing.exists()) {
      console.log(`Writing project: ${proj.id} - ${proj.title}`);
      await setDoc(projDoc, cleanPayload({ ...proj, order: i }), { merge: true });
    } else {
      console.log(`Project ${proj.id} already exists`);
    }
  }

  // 2. Education
  console.log('Checking education...');
  for (const edu of INITIAL_EDUCATION) {
    const eduDoc = doc(db, 'education', edu.id);
    const existing = await getDoc(eduDoc);
    if (!existing.exists()) {
      console.log(`Writing education: ${edu.id} - ${edu.degree}`);
      await setDoc(eduDoc, cleanPayload(edu), { merge: true });
    }
  }

  // 3. Profile
  console.log('Checking profile...');
  const profileDoc = doc(db, 'site_content', 'main_profile');
  const profileSnap = await getDoc(profileDoc);
  if (!profileSnap.exists()) {
    console.log('Writing initial profile...');
    await setDoc(profileDoc, cleanPayload(INITIAL_PROFILE), { merge: true });
  } else {
    // Merge any missing fields into profile
    const currentData = profileSnap.data();
    const merged = { ...INITIAL_PROFILE, ...currentData };
    await setDoc(profileDoc, cleanPayload(merged), { merge: true });
    console.log('Profile verified and merged');
  }

  // 4. Experiences
  console.log('Checking experiences...');
  for (const exp of INITIAL_EXPERIENCE) {
    const expDoc = doc(db, 'experiences', exp.id);
    const existing = await getDoc(expDoc);
    if (!existing.exists()) {
      console.log(`Writing experience: ${exp.id} - ${exp.company}`);
      await setDoc(expDoc, cleanPayload(exp), { merge: true });
    }
  }

  // 5. Skills
  console.log('Checking skills...');
  for (const skill of SKILL_CATEGORIES) {
    const skillDoc = doc(db, 'skills', skill.id);
    const existing = await getDoc(skillDoc);
    if (!existing.exists()) {
      console.log(`Writing skill: ${skill.id} - ${skill.name}`);
      await setDoc(skillDoc, cleanPayload(skill), { merge: true });
    }
  }

  console.log('Seeding complete successfully!');
  await terminate(db);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
