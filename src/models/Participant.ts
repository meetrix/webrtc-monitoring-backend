import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface ParticipantType {
  _id?: string;
  participantName: string;
  participantJid: string;
  participantRoomJid: string;
  roomName: string;
  roomJid: string;
  roomId: string;
  faulty: number;
  joined: Date;
  left: Date | null;
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
  faulty: { type: Number, index: true },
  joined: { type: Date, index: true },
  left: { type: Date, index: false },
};

const ParticipantSchema = new Schema(ParticipantSchemaDef, {
  timestamps: true,
});

export type ParticipantDocument = Document & ParticipantType;

export const Participant = model<ParticipantDocument>(
  'Participant',
  ParticipantSchema
);
