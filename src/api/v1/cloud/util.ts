import { FolderType } from '../../../models/FileSystemEntity';

/**
 * Detects possible cycles after moving a folder. 
 * A folder cannot be moved into itself or into any of its children. 
 * 
 * @param fs File System (only the folders from the same provider)
 * @param sourceId Id of the folder which is being moved
 * @param destinationId Id of the destination folder to put the source folder in
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
      .filter((d) => d.parentId === sourceId)
      .forEach((d) => childIds.push(d._id));
  }

  return false;
};
