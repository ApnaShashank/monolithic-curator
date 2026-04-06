import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'folder' },
    color: { type: String, default: '#ffffff' },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Collection ||
  mongoose.model<ICollection>('Collection', CollectionSchema);
