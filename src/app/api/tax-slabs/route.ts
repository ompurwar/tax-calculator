import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TaxSlabDocument } from '@/types/tax';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assessmentYear = searchParams.get('assessmentYear');
    const regime = searchParams.get('regime') || 'new';

    if (!assessmentYear) {
      return NextResponse.json(
        { error: 'Assessment year is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('tax-calculator');
    const collection = db.collection<TaxSlabDocument>('taxSlabs');

    const taxSlab = await collection.findOne({
      assessmentYear,
      regime,
    });

    if (!taxSlab) {
      return NextResponse.json(
        { error: 'Tax slab not found for the specified assessment year and regime' },
        { status: 404 }
      );
    }

    return NextResponse.json(taxSlab);
  } catch (error) {
    console.error('Error fetching tax slabs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
