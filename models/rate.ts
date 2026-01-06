import mongoose, { Schema, Model, Document } from "mongoose";

export interface IRate extends Document {
  userId: string;
  nazoId: string;
  rate: number;
  createdAt: Date;
  updatedAt: Date;
}

const RateSchema = new Schema<IRate>(
  {
    userId: { type: String, required: true },
    nazoId: { type: String, required: true },
    rate: { type: Number, required: true, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only rate a nazo once
RateSchema.index({ userId: 1, nazoId: 1 }, { unique: true });
// Optimize "My Rated Nazos" sort query
RateSchema.index({ userId: 1, updatedAt: -1 });

const Rate: Model<IRate> =
  mongoose.models.Rate || mongoose.model<IRate>("Rate", RateSchema);

export default Rate;
