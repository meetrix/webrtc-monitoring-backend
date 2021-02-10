import { Document, Schema, SchemaOptions } from 'mongoose';

export interface FileSystemEntityType {
  type: 'File' | 'Folder'; // Discriminator
  _id?: string; // folder.key; file.recordingId
  name: string;
  createdAt?: Date; // fse.timestamp
  modifiedAt?: Date;
  parentId: null | string; // folder.parentId; file.folderId
}

const fileSystemEntitySchemaDef = {
  type: String,
  id: String,
  name: String,
  createdAt: Date,
  modifiedAt: Date,
  parentId: String,
};

export interface FolderType extends FileSystemEntityType {
  type: 'Folder';
}

const folderSchemaDef = {};

export interface FileType extends FileSystemEntityType {
  type: 'File';
  description: string;
  size: number; // bytes
  provider: 'S3'; // For future use
  providerKey: string; // Storage provider key
}

const fileSchemaDef = {
  description: String,
  size: Number,
  provider: String,
  providerKey: String,
};

const options: SchemaOptions = { discriminatorKey: 'type', timestamps: true };

export const fileSystemEntitySchema = new Schema(fileSystemEntitySchemaDef, options);
export const folderSchema = new Schema(folderSchemaDef, options);
export const fileSchema = new Schema(fileSchemaDef, options);

export type FileSystemEntityDocument = Document & FileSystemEntityType;
export type FolderDocument = Document & FolderType;
export type FileDocument = Document & FileType;
