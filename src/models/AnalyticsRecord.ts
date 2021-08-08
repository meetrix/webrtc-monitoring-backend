import mongoose from 'mongoose';

export interface AnalyticsRecordType {
  // c: string; // category
  a: string; // action
  d: unknown; // additional data -- recording length, devices etc.
  u: string; // user (userId or local tracking id)
  p: number; // user plan; free = 0, free_loggedin = 10, standard = 100, premium = 1000
  t: number; // timestamp
}

export type AnalyticsRecordDocument = mongoose.Document & AnalyticsRecordType;

const analyticsRecordSchema = new mongoose.Schema(
  {
    // c: String,
    a: String,
    d: { type: mongoose.SchemaTypes.Mixed },
    u: String,
    p: { type: Number, default: 0 },
    t: Number,
  },
  { timestamps: false }
);

export const AnalyticsRecord = mongoose.model<AnalyticsRecordDocument>(
  'AnalyticsRecord',
  analyticsRecordSchema
);
