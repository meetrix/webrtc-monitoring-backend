import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface RoomType {
  _id?: string;
  roomName: string;
  roomJid: string;
  faulty: number;
  created: number;
  destroyed: number;
}

const RoomSchemaDef: SchemaDefinition = {
  roomName: { type: String, index: true },
  roomJid: { type: String, index: true },
  faulty: { type: Number, index: true },
  created: { type: Number, index: true },
  destroyed: { type: Number, index: false },
};

const RoomSchema = new Schema(RoomSchemaDef, { timestamps: true });

export type RoomDocument = Document & RoomType;

export const Room = model<RoomDocument>('Room', RoomSchema);
