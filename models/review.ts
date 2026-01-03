import mongoose, { Schema, Model, Document } from "mongoose";

export interface IReview extends Document {
  userId: string;
  nazoId: string;
  review?: string;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true },
    nazoId: { type: String, required: true },
    review: { type: String },
    memo: { type: String },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only review a nazo once
ReviewSchema.index({ userId: 1, nazoId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
