import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { TaxSlabDocument } from '../src/types/tax';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tax-calculator';

const taxSlabsData: TaxSlabDocument[] = [
  // Assessment Year 2023-24 (New Regime - FY 2022-23)
  {
    assessmentYear: '2023-24',
    regime: 'new',
    standardDeduction: 0,
    cessRate: 0.04,
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
  // Assessment Year 2024-25 (New Regime - FY 2023-24)
  {
    assessmentYear: '2024-25',
    regime: 'new',
    standardDeduction: 50000,
    cessRate: 0.04,
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 600000, rate: 0.05 },
      { upTo: 900000, rate: 0.1 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Assessment Year 2025-26 (New Regime - FY 2024-25)
  {
    assessmentYear: '2025-26',
    regime: 'new',
    standardDeduction: 75000,
    cessRate: 0.04,
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
