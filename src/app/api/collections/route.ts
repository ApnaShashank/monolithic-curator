import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Collection from '@/models/Collection';
import Item from '@/models/Item';

// GET /api/collections
export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find().sort({ createdAt: -1 }).lean();

    // Get item counts per collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (col) => {
        const count = await Item.countDocuments({
          collections: col._id,
          isArchived: false,
        });
        const previewItems = await Item.find({ collections: col._id, isArchived: false })
          .select('thumbnail title type')
          .limit(3)
          .lean();
        return { ...col, itemCount: count, previewItems };
      })
    );

    return NextResponse.json({ collections: collectionsWithCounts });
  } catch (error) {
    console.error('GET /api/collections error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST /api/collections
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { title, description, icon, color } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const collection = await Collection.create({
      title: title.trim(),
      description: description || '',
      icon: icon || 'folder',
      color: color || '#ffffff',
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collections error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
