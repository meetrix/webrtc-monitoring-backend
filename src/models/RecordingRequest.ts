import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface RecordingRequestType {
  _id?: string;
  ownerId: string;
  recorderEmail: string;
  expiry: Date;
  used: boolean;
  fileIds: string[];
  sealed: boolean;
}

const requestRecordingDef: SchemaDefinition = {
  ownerId: { type: String, index: true },
  recorderEmail: { type: String },
  expiry: { type: Date },
  used: { type: Boolean, default: false },
  fileIds: [String],
  sealed: { type: Boolean, default: false },
};

const recordingRequestSchema = new Schema(requestRecordingDef, { timestamps: true });

export type RecordingRequestDocument = Document & RecordingRequestType;

export const RecordingRequest = model<RecordingRequestDocument>('RecordingRequest', recordingRequestSchema);
