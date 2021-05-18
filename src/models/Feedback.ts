import mongoose, { Schema } from 'mongoose';
import UUID from 'uuid/v4';

export interface FeedbackType {
  id: string;
  clientId: string;
  // name: string;
  email: string;
  rating: number;
  feedback: string;
  field: string;
  meta?: { 
    app?: { version: string }; 
    os?: { name: string; version: string }; 
    browser?: { name: string; version: string }; 
    screen?: { resolution: string; aspectRatio: string };
  };
  createdAt: Date;
}
export type FeedbackDocument = mongoose.Document & {
  id: string;
  clientId: string;
  // name: string;
  email: string;
  rating: number;
  feedback: string;
  field: string;
  format: () => FeedbackType;
};

const feedbackSchema = new mongoose.Schema(
  {
    id: { type: String, default: UUID, unique: true },
    clientId: String,
    // name: String,
    email: { type: String, unique: false },
    rating: Number,
    feedback: String,
    field: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

feedbackSchema.methods = {
  format: function (): FeedbackType {
    const result = {
      id: this.id,
      clientId: this.clientId,
      // name: this.name,
      email: this.email,
      rating: this.rating,
      feedback: this.feedback,
      field: this.field,
      meta: this.meta,
      createdAt: this.createdAt
    };

    return result;
  }
};

export const Feedback = mongoose.model<FeedbackDocument>('Feedback', feedbackSchema);
