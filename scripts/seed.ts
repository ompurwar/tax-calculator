import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { TaxSlabDocument } from '../src/types/tax';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tax-calculator';

const taxSlabsData: TaxSlabDocument[] = [
  // AY 2023-24 (FY 2022-23) — New Regime (पुराना 6-स्लैब), no std. deduction
  {
    assessmentYear: '2023-24',
    regime: 'new',
    standardDeduction: 0,
    cessRate: 0.04,
    rebate: { amount: 12500, incomeThreshold: 500000 }, // 87A: rebate up to ₹12.5k if income ≤ ₹5L
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 750000, rate: 0.1 },
      { upTo: 1000000, rate: 0.15 },
      { upTo: 1250000, rate: 0.2 },
      { upTo: 1500000, rate: 0.25 },
      { upTo: Infinity, rate: 0.3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // AY 2024-25 (FY 2023-24) — Revised slabs + ₹50k std. deduction, 87A up to ₹7L
  {
    assessmentYear: '2024-25',
    regime: 'new',
    standardDeduction: 50000,
    cessRate: 0.04,
    rebate: { amount: 25000, incomeThreshold: 700000 }, // 87A: rebate up to ₹25k if income ≤ ₹7L
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // AY 2025-26 (FY 2024-25) — Same as AY 2024-25
  {
    assessmentYear: '2025-26',
    regime: 'new',
    standardDeduction: 50000,
    cessRate: 0.04,
    rebate: { amount: 25000, incomeThreshold: 700000 }, // 87A: rebate up to ₹25k if income ≤ ₹7L
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // AY 2026-27 (FY 2025-26) — Zero tax up to ₹12L (₹12.75L salaried after ₹75k std. deduction)
  {
    assessmentYear: '2026-27',
    regime: 'new',
    standardDeduction: 75000,      // salaried standard deduction
    cessRate: 0.04,
    rebate: { amount: 60000, incomeThreshold: 1200000 }, // 87A: rebate up to ₹60k if income ≤ ₹12L
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('tax-calculator');
    const collection = db.collection<TaxSlabDocument>('taxSlabs');

    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing tax slabs');

    // Insert new data
    const result = await collection.insertMany(taxSlabsData);
    console.log(`Inserted ${result.insertedCount} tax slabs`);

    // Create index for faster queries
    await collection.createIndex({ assessmentYear: 1, regime: 1 }, { unique: true });
    console.log('Created index on assessmentYear and regime');

    console.log('\nSeeded tax slabs:');
    taxSlabsData.forEach((slab) => {
      console.log(`  - ${slab.assessmentYear} (${slab.regime} regime)`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase seeding completed!');
  }
}

seedDatabase();
