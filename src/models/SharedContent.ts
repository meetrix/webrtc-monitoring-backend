import { Document, Schema, model } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface SharedContentType {
  _id?: string;
  ownerId: string;
  entityIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const sharedContentSchemaDef = {
  _id: { type: String, default: uuid },
  ownerId: { type: String, index: true },
  entityIds: [String],
  createdAt: Date,
  updatedAt: Date,
};

const sharedContentSchema = new Schema(sharedContentSchemaDef, { timestamps: true });

export type SharedContentDocument = Document & SharedContentType;

export const SharedContent = model<SharedContentDocument>('SharedContent', sharedContentSchema);
