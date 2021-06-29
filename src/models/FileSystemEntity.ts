import { Document, Schema, SchemaOptions } from 'mongoose';
import { v1 as uuid } from 'uuid';

export interface FileSystemEntityType {
  type: 'File' | 'Folder'; // Discriminator
  _id?: string; // folder.key; file.recordingId
  name: string;
  provider: 'S3' | 'S3:plugin' | 'S3:request' | 'IDB';
  createdAt?: Date; // fse.timestamp
  updatedAt?: Date;
  parentId: null | string; // folder.parentId; file.folderId
}

const fileSystemEntitySchemaDef = {
  _id: { type: String, default: uuid },
  type: String,
  name: String,
  provider: String,
  createdAt: Date,
  updatedAt: Date,
  parentId: String,
};

export interface FolderType extends FileSystemEntityType {
  type: 'Folder';
}

const folderSchemaDef = {};

export interface FileType extends FileSystemEntityType {
  type: 'File';
  description?: string;
  size: number; // bytes
  providerKey: string; // Storage provider key
  url?: string;
  recorderEmail?: string;  //Used for plugin only
  recorderName?: string; //Used for plugin only
}

const fileSchemaDef = {
  description: String,
  size: Number,
  providerKey: String,
  url: String,
};

const options: SchemaOptions = { discriminatorKey: 'type', timestamps: true };

export const fileSystemEntitySchema = new Schema(fileSystemEntitySchemaDef, options);
export const folderSchema = new Schema(folderSchemaDef, options);
export const fileSchema = new Schema(fileSchemaDef, options);

export type FileSystemEntityDocument = Document & FileSystemEntityType;
export type FolderDocument = Document & FolderType;
export type FileDocument = Document & FileType;
