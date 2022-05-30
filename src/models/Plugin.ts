import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface PluginType {
  _id?: string;
  synonyms: string[]; // Keeps the link between regenerated tokens
  ownerId: string;
  domain: string;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pluginSchemaDef: SchemaDefinition = {
  synonyms: { type: [String], default: [], index: true },
  ownerId: { type: String, index: true },
  domain: { type: String, index: true },
  revoked: { type: Boolean, default: false },
};

const pluginSchema = new Schema(pluginSchemaDef, { timestamps: true });

export type PluginDocument = Document & PluginType;

export const Plugin = model<PluginDocument>('Plugin', pluginSchema);
