import mongoose from 'mongoose';

// This is solely for tracking user recordings and lengths

export interface AnalyticsRecordType {
  c: string; // category
  a: string; // action
  d: { [key: string]: string }; // additional data -- recording length, devices etc.
  u: string; // user (userId or local tracking id)
  t: number; // timestamp
}

export type AnalyticsRecordDocument = mongoose.Document & AnalyticsRecordType;

const analyticsRecordSchema = new mongoose.Schema({
  c: String,
  a: String,
  d: { type: Map, of: String },
  u: String,
  t: Number,
}, { timestamps: false });

export const AnalyticsRecord
  = mongoose.model<AnalyticsRecordDocument>('AnalyticsRecord', analyticsRecordSchema);
