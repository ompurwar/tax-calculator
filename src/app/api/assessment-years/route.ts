import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TaxSlabDocument } from '@/types/tax';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('tax-calculator');
    const collection = db.collection<TaxSlabDocument>('taxSlabs');

    // Get distinct assessment years for new regime only
    const years = await collection.distinct('assessmentYear', { regime: 'new' });
    
    // Sort years in descending order
    const sortedYears = years.sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearB - yearA;
    });

    const assessmentYears = sortedYears.map(year => ({
      year,
      label: `AY ${year}`,
    }));

    return NextResponse.json(assessmentYears);
  } catch (error) {
    console.error('Error fetching assessment years:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
