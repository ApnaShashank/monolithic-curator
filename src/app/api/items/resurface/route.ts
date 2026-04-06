import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch random items for the specific user
    const resurfaced = await Item.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(session.user.id), isArchived: false } },
      { $sample: { size: 4 } }
    ]);

    return NextResponse.json({ items: resurfaced });
  } catch (error) {
    console.error('GET /api/items/resurface error:', error);
    return NextResponse.json({ error: 'Failed to resurface' }, { status: 500 });
  }
}
