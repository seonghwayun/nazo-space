import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INazo extends Document {
  originalTitle: string;
  description?: string;
  translatedTitle?: string;
  creators?: mongoose.Types.ObjectId[]; // References to 'Creator' collection
  difficulty?: number;
  estimatedTime?: string;
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
    difficulty: {
      type: Number,
      min: 1,
      max: 10, // Assuming a 1-10 scale, adjustable
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

// Prevent overwriting the model if it's already compiled (Next.js hot reload fix)
const Nazo: Model<INazo> =
  mongoose.models.Nazo || mongoose.model<INazo>('Nazo', NazoSchema);

export default Nazo;
