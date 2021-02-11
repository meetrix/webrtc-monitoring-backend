import { FileSystemEntityType, FileType, FolderType } from '../../../models/FileSystemEntity';

/**
 * Detects possible cycles after moving a folder. 
 * A folder cannot be moved into itself or into any of its children. 
 * 
 * @param fs File System (only the folders from the same provider)
 * @param sourceId Id of the folder which is being moved
 * @param destinationId Id of the destination folder to put the source folder in
 * @returns whether cycles were detected
 */
export const detectCycles = (
  fs: FolderType[],
  sourceId: string,
  destinationId: string): boolean => {

  const childIds = [sourceId];
  while (childIds.length > 0) {
    const childId = childIds.shift();
    if (childId === destinationId) {
      return true;
    }

    fs
      .filter((d) => d.parentId === childId)
      .forEach((d) => childIds.push(d._id.toString()));
  }

  return false;
};

/**
 * Finds all files and folders a folder contains in all depths (BFS). 
 * 
 * @param fs File system (files and folders from the same provider)
 * @param ancestor Id of the folder to find descendants
 * @returns Descendants of the folder including itself
 */
export const filterDescendants = (
  fs: FileSystemEntityType[],
  ancestor: FolderType
): { folders: FolderType[]; files: FileType[] } => {
  const files = [] as FileType[];
  const folders = [] as FolderType[];

  const children = [ancestor];
  while (children.length > 0) {
    const child = children.shift();
    folders.push(child);

    fs
      .filter((f) => f.parentId === child._id)
      .forEach((f) => {
        if (f.type === 'File') {
          files.push(f as FileType);
        } else if (f.type === 'Folder') {
          children.push(f as FolderType);
        }
      });
  }

  return { folders, files };
};
