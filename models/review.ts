import mongoose, { Schema, Model, Document } from "mongoose";

export interface IReview extends Document {
  userId: string;
  nazoId: string;
  review?: string;
  memo?: string;
  playedAt?: Date;
  /** "played" | "unplayed". Missing on records saved before statuses existed: treat as played (see lib/play-log). */
  status?: string;
  durationMinutes?: number;
  companions?: string;
  hasSpoiler?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true },
    nazoId: { type: String, required: true },
    review: { type: String },
    memo: { type: String },
    playedAt: { type: Date },
    status: { type: String, enum: ["played", "unplayed"] },
    durationMinutes: { type: Number, min: 0 },
    companions: { type: String },
    hasSpoiler: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only review a nazo once
ReviewSchema.index({ userId: 1, nazoId: 1 }, { unique: true });
// Index for "Recently Reviewed"
ReviewSchema.index({ createdAt: -1 });
// Public review list of a nazo
ReviewSchema.index({ nazoId: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
