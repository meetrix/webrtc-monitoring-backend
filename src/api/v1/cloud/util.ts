import { FileSystemEntityType, FolderType } from '../../../models/FileSystemEntity';

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
      .forEach((d) => childIds.push(d._id));
  }

  return false;
};

/**
 * Finds all files and folders a folder contains in all depths (BFS). 
 * 
 * @param fs File system (files and folders from the same provider)
 * @param ancestorId Id of the folder to find descendants
 * @returns Descendant ids of the folder including itself
 */
export const filterDescendants = (
  fs: FileSystemEntityType[],
  ancestorId: string
): { folders: string[]; files: string[] } => {
  const files = [] as string[];
  const folders = [] as string[];

  const childIds = [ancestorId];
  while (childIds.length > 0) {
    const childId = childIds.shift();
    folders.push(childId);

    fs
      .filter((f) => f.parentId === childId)
      .forEach((f) => {
        if (f.type === 'File') {
          files.push(f._id);
        } else if (f.type === 'Folder') {
          childIds.push(f._id);
        }
      });
  }

  return { folders, files };
};
