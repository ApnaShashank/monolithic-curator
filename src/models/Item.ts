import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  id: string;
  title: string;
  url?: string;
  type: 'article' | 'video' | 'pdf' | 'tweet' | 'image' | 'note' | 'link';
  content: string;
  summary?: string;
  tags: string[];
  thumbnail?: string;
  favicon?: string;
  source?: string;
  siteName?: string;
  metadata?: {
    author?: string;
    readTime?: number;
    platform?: string;
    publishedAt?: string;
    wordCount?: number;
    locale?: string;
    socialLinks?: string[];
    hashtags?: string[];
  };
  highlights: Array<{ text: string; color: string; note?: string }>;
  collections: string[];
  embeddingId?: string;
  isArchived: boolean;
  isBookmarked: boolean;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    type: {
      type: String,
      enum: ['article', 'video', 'pdf', 'tweet', 'image', 'note', 'link'],
      default: 'link',
    },
    content: { type: String, default: '' },
    summary: { type: String },
    tags: [{ type: String, lowercase: true, trim: true }],
    thumbnail: { type: String },
    favicon: { type: String },
    source: { type: String },
    siteName: { type: String },
    metadata: {
      author: String,
      readTime: Number,
      platform: String,
      publishedAt: String,
      wordCount: Number,
      locale: String,
      socialLinks: [String],
      hashtags: [String],
    },
    highlights: [
      {
        text: String,
        color: { type: String, default: '#ffffff' },
        note: String,
      },
    ],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    embeddingId: { type: String },
    isArchived: { type: Boolean, default: false },
    isBookmarked: { type: Boolean, default: false },
    lastAccessedAt: { type: Date },
  },
  { timestamps: true }
);

ItemSchema.index({ tags: 1 });
ItemSchema.index({ type: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
