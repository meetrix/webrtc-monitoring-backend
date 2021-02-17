import mongoose from 'mongoose';

// This is solely for tracking user recordings and lengths

export interface RecordingType {
  ltid: string;
  email: string;
  duration: number;
  createdAt: Date;
}

export type RecordingDocument = mongoose.Document & RecordingType & {
  format: () => RecordingType;
}

const recordingSchema = new mongoose.Schema({
  ltid: String,
  email: String,
  duration: Number,
}, { timestamps: true });

recordingSchema.methods = {
  format: function (): RecordingType {
    const result = {
      ltid: this.ltid,
      email: this.email,
      duration: this.duration,
      createdAt: this.createdAt
    };

    return result;
  }
};

export const Recording = mongoose.model<RecordingDocument>('Recording', recordingSchema);
