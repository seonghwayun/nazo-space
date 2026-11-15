import mongoose, { Schema, Document, Model } from "mongoose";

/** On/kun readings for a kanji in the practice words (the readings hint). */
export interface IPracticeKanji extends Document {
  literal: string;
  on: string[];
  kun: string[];
}

const PracticeKanjiSchema: Schema = new Schema({
  literal: { type: String, required: true, unique: true },
  on: [String],
  kun: [String],
});

const PracticeKanji: Model<IPracticeKanji> =
  mongoose.models.PracticeKanji || mongoose.model<IPracticeKanji>("PracticeKanji", PracticeKanjiSchema);

export default PracticeKanji;
