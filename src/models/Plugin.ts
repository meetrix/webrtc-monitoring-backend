import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface PluginType {
  _id?: string;
  ownerId: string;
  domain: string;
}

const pluginSchemaDef: SchemaDefinition = {
  ownerId: { type: String, index: true },
  domain: String,
};

const pluginSchema = new Schema(pluginSchemaDef, { timestamps: true });

export type PluginDocument = Document & PluginType;

export const Plugin = model<PluginDocument>('Plugin', pluginSchema);
