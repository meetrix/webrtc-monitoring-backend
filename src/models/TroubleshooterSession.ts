import { Document, model, Schema, SchemaDefinition } from 'mongoose';

export interface DeviceType {
  kind: string;
  label: string;
}

export interface MetadataType {
  browser: {
    name: string;
    version: string;
    isPrivateBrowsing: boolean;
  };
  os: {
    name: string;
    version: string;
  };
  audioInputDevices: DeviceType[];
  audioOutputDevices: DeviceType[];
  videoInputDevices: DeviceType[];
  display: {
    aspectRatio: string;
    resolution: string;
  };
}

export interface TroubleshooterSessionType {
  _id?: string; // testId
  clientId: string;
  pluginId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  tests: {
    browser: { status: boolean };
    camera: { status: boolean };
    microphone: { status: boolean };
    network: { status: boolean };

    overall: { status: boolean };
  };
  metadata: MetadataType;
}

const troubleshooterSessionSchemaDef: SchemaDefinition = {
  clientId: { type: String, index: true },
  pluginId: { type: String, index: true },
  ownerId: { type: String, index: true },

  tests: {
    browser: {
      // TODO: future: add messages etc.
      status: { type: Boolean, default: false },
    },
    camera: {
      status: { type: Boolean, default: false },
    },
    microphone: {
      status: { type: Boolean, default: false },
    },
    network: {
      status: { type: Boolean, default: false },
    },

    overall: {
      status: { type: Boolean, default: false },
    },
  },
  metadata: {
    browser: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
      isPrivateBrowsing: { type: Boolean, default: false },
    },
    os: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
    },
    audioInputDevices: [
      {
        kind: { type: String, default: '' },
        label: { type: String, default: '' },
        _id: false,
      },
    ],
    audioOutputDevices: [
      {
        kind: { type: String, default: '' },
        label: { type: String, default: '' },
        _id: false,
      },
    ],
    videoInputDevices: [
      {
        kind: { type: String, default: '' },
        label: { type: String, default: '' },
        _id: false,
      },
    ],
    display: {
      aspectRatio: { type: String, default: '' },
      resolution: { type: String, default: '' },
    },
  },
};

const troubleshooterSessionSchema = new Schema(troubleshooterSessionSchemaDef, {
  timestamps: true,
});

export type TroubleshooterSessionDocument = Document &
  TroubleshooterSessionType;

export const TroubleshooterSession = model<TroubleshooterSessionDocument>(
  'TroubleshooterSession',
  troubleshooterSessionSchema
);
