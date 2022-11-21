import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface ErrorEventType {
  _id?: string;
  roomId: string;
  participantId: string;
  eventSourceType: string;
  eventSourceId: string;
  errorType: string;
  errorValue: string;
  timestamp: Date;
}

const ErrorEventSchemaDef: SchemaDefinition = {
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
  },
  eventSourceType: { type: String, index: false },
  eventSourceId: { type: String, index: false },
  errorType: { type: String, index: false },
  errorValue: { type: String, index: false },
  timestamp: { type: Date, index: false },
};

const ErrorEventSchema = new Schema(ErrorEventSchemaDef, {
  timestamps: true,
});

export type ErrorEventDocument = Document & ErrorEventType;

export const ErrorEvent = model<ErrorEventDocument>(
  'ErrorEvent',
  ErrorEventSchema
);
