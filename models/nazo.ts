import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INazo extends Document {
  originalTitle: string;
  description?: string;
  translatedTitle?: string;
  creators?: mongoose.Types.ObjectId[]; // References to 'Creator' collection
  tags?: mongoose.Types.ObjectId[]; // References to 'Tag' collection
  imageUrl?: string;
  difficulty?: string;
  estimatedTime?: string;
  averageRate?: number;
  rateCount?: number;
  totalRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NazoSchema: Schema = new Schema(
  {
    originalTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    translatedTitle: {
      type: String,
      trim: true,
    },
    creators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Creator', // Assumes a 'Creator' model will exist
      },
    ],
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    imageUrl: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      trim: true,
    },
    averageRate: {
      type: Number,
      default: 0,
    },
    rateCount: {
      type: Number,
      default: 0,
    },
    totalRate: {
      type: Number,
      default: 0,
    },
    estimatedTime: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for performance
NazoSchema.index({ createdAt: -1 }); // For "Recently Added"
NazoSchema.index({ averageRate: -1, rateCount: -1 }); // For "Top Rated"

// Prevent overwriting the model if it's already compiled (Next.js hot reload fix)
const Nazo: Model<INazo> =
  mongoose.models.Nazo || mongoose.model<INazo>('Nazo', NazoSchema);

export default Nazo;
