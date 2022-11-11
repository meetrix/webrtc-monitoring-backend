import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface ParticipantType {
  _id?: string;
  participantName: string;
  participantJid: string;
  participantRoomJid: string;
  roomName: string;
  roomJid: string;
  roomId: string;
  joined?: number;
  left?: number;
}

const ParticipantSchemaDef: SchemaDefinition = {
  participantName: { type: String, index: false },
  participantJid: { type: String, index: true },
  participantRoomJid: { type: String, index: false },
  roomName: { type: String, index: false },
  roomJid: { type: String, index: true },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
  joined: { type: Number, index: true },
  left: { type: Number, index: false },
};

const ParticipantSchema = new Schema(ParticipantSchemaDef, {
  timestamps: true,
});

export type ParticipantDocument = Document & ParticipantType;

export const Participant = model<ParticipantDocument>(
  'Participant',
  ParticipantSchema
);
