import mongoose from 'mongoose';
import UUID from 'uuid/v4';

export interface FeedbackType {
  id: string;
  clientId: string;
  name: string;
  email: string;
  feedback: string;

}
export type FeedbackDocument = mongoose.Document & {
  id: string;
  clientId: string;
  name: string;
  email: string;
  feedback: string;
  format: () => FeedbackType;
};

const feedbackSchema = new mongoose.Schema(
  {
    id: { type: String, default: UUID, unique: true },
    clientId: String,
    name: String,
    email: { type: String, unique: false },
    feedback: String,

  },
  { timestamps: true }
);

feedbackSchema.methods = {

  format: function (): FeedbackType {
    const result = {
      id: this.id,
      clientId: this.clientId,
      name: this.name,
      email: this.email,
      feedback: this.feedback,

    };

    return result;
  }
};

export const Feedback = mongoose.model<FeedbackDocument>('Feedback', feedbackSchema);
