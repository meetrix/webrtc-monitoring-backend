import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface RecordingRequestType {
  _id?: string;
  ownerId: string;
  expiry: Date;
  used: boolean;
  fileId: string;
}

const requestRecordingDef: SchemaDefinition = {
  ownerId: { type: String, index: true },
  expiry: { type: Date },
  used: { type: Boolean, default: false },
  fileId: String,
};

const recordingRequestSchema = new Schema(requestRecordingDef, { timestamps: true });

export type RecordingRequestDocument = Document & RecordingRequestType;

export const RecordingRequest = model<RecordingRequestDocument>('RecordingRequest', recordingRequestSchema);
