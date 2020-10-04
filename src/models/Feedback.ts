import mongoose from 'mongoose';
import UUID from 'uuid/v4';

export interface FeedbackType {
    id: string;
    name: string;
    email: string;
    feedback: string;
  
}
export type FeedbackDocument = mongoose.Document & {
    id: string;
    name: string;
    email: string;
    feedback: string;
    format: () => FeedbackType;
};

const feedbackSchema = new mongoose.Schema(
    {
        id: { type: String, default: UUID, unique: true },
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
            name: this.name,
            email: this.email,
            feedback: this.feedback,
            
        };

        return result;
    }
};

export const Feedback = mongoose.model<FeedbackDocument>('Feedback', feedbackSchema);
