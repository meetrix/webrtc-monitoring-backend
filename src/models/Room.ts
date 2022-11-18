import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface RoomType {
  _id?: string;
  roomName: string;
  roomJid: string;
  faulty: number;
  created: Date;
  destroyed: Date | null;
}

export interface RoomTypeWithVirtuals extends RoomType {
  participants: number;
}

const RoomSchemaDef: SchemaDefinition = {
  roomName: { type: String, index: true },
  roomJid: { type: String, index: true },
  faulty: { type: Number, index: true },
  created: { type: Date, index: true },
  destroyed: { type: Date, index: false },
};

const RoomSchema = new Schema(RoomSchemaDef, {
  toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
  toObject: { virtuals: true }, // So `console.log()` and other functions that use `toObject()` include virtuals
  timestamps: true,
});

RoomSchema.virtual('participants', {
  ref: 'Participant',
  localField: '_id',
  foreignField: 'roomId',
  count: true, // And only get the number of docs
});

export type RoomDocument = Document & RoomTypeWithVirtuals;

export const Room = model<RoomDocument>('Room', RoomSchema);
