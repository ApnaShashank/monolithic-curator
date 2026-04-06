import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import Collection from '@/models/Collection';

// DELETE /api/user/purge - Permanently delete all items and collections for current user
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    // Delete all Items
    const itemResult = await Item.deleteMany({ userId });
    
    // Delete all Collections
    const collectionResult = await Collection.deleteMany({ userId });

    return NextResponse.json({ 
      message: 'User data purged successfully',
      itemsDeleted: itemResult.deletedCount,
      collectionsDeleted: collectionResult.deletedCount
    });
  } catch (error) {
    console.error('DELETE /api/user/purge error:', error);
    return NextResponse.json({ error: 'Failed to purge data' }, { status: 500 });
  }
}
