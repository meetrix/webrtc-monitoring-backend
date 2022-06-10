import { Document, Schema, model, SchemaDefinition } from 'mongoose';

export interface StaticModeConfig {
  iceServers: any[];
}

const staticModeConfigSchemaDef: SchemaDefinition = {
  iceServers: { type: [Schema.Types.Mixed], default: [] },
};

const staticModeConfigSchema = new Schema(staticModeConfigSchemaDef, {
  _id: false,
});

interface SharedSecretModeConfig {
  uri: string;
  secret: string;
}

const sharedSecretModeConfigSchemaDef: SchemaDefinition = {
  uri: { type: String, required: true },
  secret: { type: String, required: true },
};

const sharedSecretModeConfigSchema = new Schema(
  sharedSecretModeConfigSchemaDef,
  { _id: false }
);

interface UrlModeConfig {
  url: string;
  method: string;
  headers?: { [key: string]: string };
  body?: any;
  extract?: string;
}

const urlModeConfigSchemaDef = {
  url: { type: String, required: true },
  method: { type: String, default: 'GET' },
  headers: { type: Schema.Types.Mixed },
  body: { type: Schema.Types.Mixed },
  extract: { type: String },
};

const urlModeConfigSchema = new Schema(urlModeConfigSchemaDef, { _id: false });

export enum IceServerConfigMode {
  STATIC = 'static',
  SHARED_SECRET = 'shared-secret',
  URL = 'url',
}

export interface IceServerConfigSchemaDef {
  _id?: string;
  mode: IceServerConfigMode;
  createdAt: Date;
  updatedAt: Date;
}

const iceServerConfigSchemaDef: SchemaDefinition = {
  mode: {
    type: String,
    enum: Object.values(IceServerConfigMode),
    required: true,
  },
  ownerId: { type: String, required: true, index: true },
  pluginId: { type: String, required: true, index: true },
};

const iceServerConfigSchema = new Schema(iceServerConfigSchemaDef, {
  timestamps: true,
  discriminatorKey: 'mode',
});

export type IceServerConfigDocument = Document & IceServerConfigSchemaDef;

export const IceServerConfig = model<IceServerConfigDocument>(
  'IceServerConfig',
  iceServerConfigSchema
);

export const StaticModeConfig = IceServerConfig.discriminator(
  'static',
  staticModeConfigSchema
);

export const SharedSecretModeConfig = IceServerConfig.discriminator(
  'shared-secret',
  sharedSecretModeConfigSchema
);

export const UrlModeConfig = IceServerConfig.discriminator(
  'url',
  urlModeConfigSchema
);
