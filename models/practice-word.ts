import mongoose, { Schema, Document, Model } from "mongoose";

/** A two-kanji word used by the 和同開珎 practice puzzles (see scripts/import-practice.mjs). */
export interface IPracticeWord extends Document {
  expression: string;
  reading: string;
  ruby: { base: string; ruby?: string }[];
  meaning: string;
  /** Takes the word out of every puzzle without deleting it. */
  disabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PracticeWordSchema: Schema = new Schema(
  {
    expression: { type: String, required: true, unique: true },
    reading: { type: String, default: "" },
    ruby: [{ _id: false, base: { type: String, required: true }, ruby: String }],
    meaning: { type: String, default: "" },
    disabled: Boolean,
  },
  { timestamps: true }
);

const PracticeWord: Model<IPracticeWord> =
  mongoose.models.PracticeWord || mongoose.model<IPracticeWord>("PracticeWord", PracticeWordSchema);

export default PracticeWord;
