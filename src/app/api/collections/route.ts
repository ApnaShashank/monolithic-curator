import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Collection from '@/models/Collection';
import Item from '@/models/Item';

// GET /api/collections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();
    const collections = await Collection.find({ userId }).sort({ createdAt: -1 }).lean();

    // Get item counts per collection — filtered by user
    const collectionsWithCounts = await Promise.all(
      collections.map(async (col) => {
        const count = await Item.countDocuments({
          userId,
          collections: col._id,
          isArchived: false,
        });
        const previewItems = await Item.find({ 
            userId, 
            collections: col._id, 
            isArchived: false 
          })
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { title, description, icon, color } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const collection = await Collection.create({
      userId: session.user.id,
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
