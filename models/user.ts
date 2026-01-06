import mongoose, { Schema, Model, Document } from "mongoose";

export interface IUser extends Document {
  userId: string; // Corresponds to Google sub ID
  nickname: string;
  email?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    nickname: { type: String, required: true },
    email: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup by userId
// UserSchema.index({ userId: 1 }); // Removed redundant index

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
