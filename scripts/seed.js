#!/usr/bin/env node
/**
 * Seed script — inserts realistic kudo data directly into MongoDB.
 *
 * Usage:
 *   node scripts/seed.js               # inserts kudos (keeps existing data)
 *   node scripts/seed.js --clear       # drops the collection first
 *
 * Config (env vars or .env file):
 *   MONGODB_URI        default: mongodb://localhost:27017
 *   MONGODB_DB         default: kudo
 *   DEFAULT_WORKSPACE_ID  default: T_DEMO
 */

import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const MONGO_DB = process.env.MONGODB_DB ?? "kudo";
const WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID ?? "T_DEMO";
const CLEAR = process.argv.includes("--clear");

// ── Fake users ────────────────────────────────────────────────────────────────

const USERS = [
  { id: "U001", name: "Alice Martin" },
  { id: "U002", name: "Bob Dupont" },
  { id: "U003", name: "Carol Petit" },
  { id: "U004", name: "David Chen" },
  { id: "U005", name: "Emma Rousseau" },
  { id: "U006", name: "François Leroy" },
  { id: "U007", name: "Grace Kim" },
  { id: "U008", name: "Hugo Bernard" },
];

const CHANNELS = ["general", "engineering", "product", "design", "ops", "random"];

const MESSAGES = [
  "Merci pour ton aide sur le deploy, tu m'as sauvé la mise !",
  "Super boulot sur la review de PR, très détaillée et constructive.",
  "Ton support pendant l'incident de nuit était irréprochable, merci !",
  "Excellent travail sur la refacto du module auth, le code est bien plus propre.",
  "Merci d'avoir pris le temps d'onboarder les nouveaux, ça fait vraiment la différence.",
  "La présentation au client était top, tu as géré les questions difficiles avec brio.",
  "Ton initiative pour améliorer les tests a réduit nos flaky tests de moitié !",
  "Merci pour l'aide sur le bug de prod ce matin, réactivité au top.",
  "Ton design sur la nouvelle feature est vraiment intuitif, le feedback utilisateur est excellent.",
  "Belle gestion de la migration de BDD sans downtime, chapeau !",
  "Tes retours en code review sont toujours pertinents et bienveillants.",
  "Tu as livré la feature en avance et la qualité est au rendez-vous, bravo !",
  "Merci pour la doc détaillée sur l'API, ça va nous faire gagner un temps fou.",
  "Super travail d'équipe sur le sprint, tu tires tout le monde vers le haut.",
  "Ton énergie et ton enthousiasme sont contagieux, merci pour l'ambiance !",
  "Excellent debugging session hier, tu as trouvé le problème en 10 min.",
  "Merci pour ton aide sur la config Kubernetes, tout tourne nickel maintenant.",
  "Ton talk interne sur les bonnes pratiques Go était vraiment enrichissant.",
  "Toujours disponible pour aider, même quand t'as la tête dans le guidon.",
  "Merci pour avoir tenu le fort pendant que j'étais en vacances !",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a random date within the last `daysBack` days */
function randomDate(daysBack) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

/** Build a kudo document (same shape as the Go store) */
function makeKudo(from, to, daysBack = 90) {
  return {
    _id: new ObjectId(),
    workspace_id: WORKSPACE_ID,
    from_user_id: from.id,
    from_user_name: from.name,
    to_user_id: to.id,
    to_user_name: to.name,
    message: pick(MESSAGES),
    channel: pick(CHANNELS),
    emoji_count: pick([1, 1, 1, 2, 2, 3]), // weighted towards 1-2
    created_at: randomDate(daysBack),
  };
}

// ── Generate kudos ─────────────────────────────────────────────────────────────

function generateKudos() {
  const kudos = [];

  // Recent kudos (last 7 days) — more activity
  for (let i = 0; i < 30; i++) {
    const from = pick(USERS);
    const to = pick(USERS.filter((u) => u.id !== from.id));
    kudos.push(makeKudo(from, to, 7));
  }

  // This month — medium activity
  for (let i = 0; i < 60; i++) {
    const from = pick(USERS);
    const to = pick(USERS.filter((u) => u.id !== from.id));
    kudos.push(makeKudo(from, to, 30));
  }

  // Last 90 days — background activity
  for (let i = 0; i < 110; i++) {
    const from = pick(USERS);
    const to = pick(USERS.filter((u) => u.id !== from.id));
    kudos.push(makeKudo(from, to, 90));
  }

  return kudos;
}

// ── Main ───────────────────────────────────────────────────────────────────────

const client = new MongoClient(MONGO_URI);

try {
  await client.connect();
  console.log(`Connected to ${MONGO_URI} / ${MONGO_DB}`);

  const db = client.db(MONGO_DB);
  const col = db.collection("kudos");

  if (CLEAR) {
    const { deletedCount } = await col.deleteMany({});
    console.log(`Cleared ${deletedCount} existing kudos`);
  }

  const kudos = generateKudos();
  const { insertedCount } = await col.insertMany(kudos);

  console.log(`Inserted ${insertedCount} kudos into workspace "${WORKSPACE_ID}"`);

  // Quick summary
  const byUser = {};
  for (const k of kudos) {
    byUser[k.to_user_name] = (byUser[k.to_user_name] ?? 0) + k.emoji_count;
  }
  console.log("\nTop recipients (seeds):");
  Object.entries(byUser)
    .sort(([, a], [, b]) => b - a)
    .forEach(([name, total]) => console.log(`  ${name}: ${total} sparks`));
} finally {
  await client.close();
}
