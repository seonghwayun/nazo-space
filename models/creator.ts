import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreator extends Document {
  name: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overwriting the model if it's already compiled
const Creator: Model<ICreator> = mongoose.models.Creator || mongoose.model<ICreator>('Creator', CreatorSchema);

export default Creator;
