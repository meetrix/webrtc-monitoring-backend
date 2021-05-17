import mongoose from 'mongoose';

// This is solely for tracking user recordings and lengths

export interface AnalyticsRecordType {
  // c: string; // category
  a: string; // action
  d: { [key: string]: string }; // additional data -- recording length, devices etc.
  u: string; // user (userId or local tracking id)
  p: number; // user plan; free = 0, free_loggedin = 10, standard = 100, premium = 1000 
  t: number; // timestamp
}

export type AnalyticsRecordDocument = mongoose.Document & AnalyticsRecordType;

const analyticsRecordSchema = new mongoose.Schema({
  // c: String,
  a: String,
  d: { type: Map, of: String },
  u: String,
  p: { type: Number, default: 0 },
  t: Number,
}, { timestamps: false });

export const AnalyticsRecord
  = mongoose.model<AnalyticsRecordDocument>('AnalyticsRecord', analyticsRecordSchema);
