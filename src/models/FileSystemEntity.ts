export interface FileSystemEntityType {
  type: 'file' | 'folder'; // Discriminator
  id: string; // folder.key; file.recordingId
  name: string;
  createdAt: Date; // fse.timestamp
  modifiedAt: Date;
  parentId: null | string; // folder.parentId; file.folderId
}

export interface FolderType extends FileSystemEntityType {
  type: 'folder';
}

export interface FileType extends FileSystemEntityType {
  type: 'file';
  description: string;
  size: number; // bytes
  provider: 'S3';
  providerKey: string; // Storage provider key
}
