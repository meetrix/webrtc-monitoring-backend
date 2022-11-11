import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface Connection {
  id?: string;
  timestamp?: string;
  type?: string;
  transportId?: string;
  localCandidateId?: string;
}

export interface InboundStream {
  id?: string;
  timestamp?: string;
  type?: string;
  ssrc?: string;
  kind?: string;
}

export interface OutboundStream {
  id?: string;
  timestamp?: string;
  type?: string;
  ssrc?: string;
  kind?: string;
}

export interface StatType {
  _id?: string;
  event: string;
  peerId: string;
  userId?: string;
  userName?: string;
  roomId?: string;
  roomName?: string;
  tag: string;
  data: {
    connection: Connection;
    audio: { inbound: InboundStream[]; outbound: OutboundStream[] };
    video: { inbound: InboundStream[]; outbound: OutboundStream[] };
  };
}

const StatSchemaDef: SchemaDefinition = {
  event: { type: String, default: [], index: true },
  peerId: { type: String, index: true },
  userId: { type: String, index: true },
  userName: { type: String, index: true },
  roomId: { type: String, index: true },
  roomName: { type: String, index: true },
  tag: { type: String, index: true },
  data: Object,
};

const StatSchema = new Schema(StatSchemaDef, { timestamps: true });

export type StatDocument = Document & StatType;

export const Stat = model<StatDocument>('Stat', StatSchema);
