/**
 * seedPieceFields.js
 * Seeds:
 *   - pieces_per_box (10–15), ava_pieces (0–9), weight_of_box (7–10 kg) on every product
 *   - transporter.name, .mobile, .vehicleType, .vehicleNumber, totalWeight on every sale
 *
 * Run once:  node server/seedPieceFields.js
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_pro';

// ── helpers ─────────────────────────────────────────────────────────────────
const randInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
const pick     = (arr) => arr[Math.floor(Math.random() * arr.length)];

const VEHICLE_TYPES   = ['Truck', 'Mini Truck', 'Tempo', 'Van', 'Bike', 'Auto'];
const TRANSPORTER_NAMES = [
  'Ram Logistics', 'Sri Ganesh Transport', 'Fast Carriers', 'Vijay Freight',
  'Lakshmi Transport', 'Sai Roadways', 'Om Cargo', 'Balaji Logistics'
];
const VEHICLE_PREFIXES = ['AP', 'TS', 'KA', 'MH', 'TN', 'DL', 'UP'];

function randomMobile() {
  const starts = ['6', '7', '8', '9'];
  let num = pick(starts);
  for (let i = 0; i < 9; i++) num += randInt(0, 9);
  return num;
}

function randomVehicleNumber() {
  const state  = pick(VEHICLE_PREFIXES);
  const dist   = String(randInt(1, 99)).padStart(2, '0');
  const series = String.fromCharCode(65 + randInt(0, 25)) + String.fromCharCode(65 + randInt(0, 25));
  const num    = String(randInt(1000, 9999));
  return `${state} ${dist} ${series} ${num}`;
}

// ── main ────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB:', URI);

    const db       = client.db();
    const products = db.collection('products');
    const sales    = db.collection('sales');

    // ── 1. Products ──────────────────────────────────────────────────────────
    const allProducts = await products.find({}).toArray();
    console.log(`\n📦 Seeding ${allProducts.length} products with piece fields...`);

    let pDone = 0;
    for (const p of allProducts) {
      // Only set if not already seeded (idempotent)
      const needsSeed = p.pieces_per_box == null || p.ava_pieces == null || p.weight_of_box == null;
      if (!needsSeed) { pDone++; continue; }

      const pieces_per_box = randInt(10, 15);
      const ava_pieces     = randInt(0, 9);
      const weight_of_box  = randFloat(7, 10, 2);

      await products.updateOne(
        { _id: p._id },
        { $set: { pieces_per_box, ava_pieces, weight_of_box } }
      );
      pDone++;
    }
    console.log(`   ✅ Done: ${pDone} products updated.`);

    // ── 2. Sales ─────────────────────────────────────────────────────────────
    const allSales = await sales.find({}).toArray();
    console.log(`\n🧾 Seeding ${allSales.length} sales with transporter + weight fields...`);

    let sDone = 0;
    for (const s of allSales) {
      const needsSeed = !s.transporter || !s.transporter.name;
      if (!needsSeed) { sDone++; continue; }

      // Calculate a realistic totalWeight from items (random fallback since we don't have live product data)
      const totalWeight = randFloat(5, 150, 2);

      await sales.updateOne(
        { _id: s._id },
        {
          $set: {
            totalWeight,
            transporter: {
              name         : pick(TRANSPORTER_NAMES),
              mobile       : randomMobile(),
              vehicleType  : pick(VEHICLE_TYPES),
              vehicleNumber: randomVehicleNumber(),
            },
          }
        }
      );
      sDone++;
    }
    console.log(`   ✅ Done: ${sDone} sales updated.`);

    console.log('\n🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
    console.log('🔌 Connection closed.');
  }
}

seed();
