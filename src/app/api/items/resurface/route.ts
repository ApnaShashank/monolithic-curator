import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';

export async function GET() {
  try {
    await connectDB();

    // Fetch 3 random items that are at least 1 week old (if possible)
    // Using aggregation for random sampling
    const resurfaced = await Item.aggregate([
      { $match: { isArchived: false } },
      { $sample: { size: 4 } }
    ]);

    return NextResponse.json({ items: resurfaced });
  } catch (error) {
    console.error('GET /api/items/resurface error:', error);
    return NextResponse.json({ error: 'Failed to resurface' }, { status: 500 });
  }
}
