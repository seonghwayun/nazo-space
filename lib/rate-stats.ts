import mongoose from "mongoose";
import Rate from "@/models/rate";
import Nazo from "@/models/nazo";

/**
 * Atomically adjusts a nazo's totalRate / rateCount and recomputes averageRate
 * (aggregation-pipeline update, MongoDB 4.2+). Uses the native collection because
 * Mongoose validation rejects pipeline arrays.
 */
export async function updateNazoStatsIncremental(nazoId: string, rateDiff: number, countDiff: number) {
  await Nazo.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(nazoId) },
    [
      {
        $set: {
          totalRate: { $add: [{ $ifNull: ["$totalRate", 0] }, rateDiff] },
          rateCount: { $add: [{ $ifNull: ["$rateCount", 0] }, countDiff] },
        },
      },
      {
        $set: {
          averageRate: {
            $cond: {
              if: { $gt: ["$rateCount", 0] },
              then: { $divide: ["$totalRate", "$rateCount"] },
              else: 0,
            },
          },
        },
      },
    ]
  );
}

/**
 * Sets (or with `null`, removes) a user's rating of a nazo and keeps the nazo's
 * aggregate stats in sync. Returns the saved rating, or null when there is none.
 */
export async function setUserRate(userId: string, nazoId: string, rate: number | null): Promise<number | null> {
  const existing = await Rate.findOne({ userId, nazoId });

  if (rate === null) {
    if (!existing) return null;
    await Rate.deleteOne({ userId, nazoId });
    await updateNazoStatsIncremental(nazoId, -existing.rate, -1);
    return null;
  }

  if (existing && existing.rate === rate) return rate;

  await Rate.findOneAndUpdate(
    { userId, nazoId },
    { $set: { rate, userId, nazoId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await updateNazoStatsIncremental(nazoId, rate - (existing ? existing.rate : 0), existing ? 0 : 1);
  return rate;
}
