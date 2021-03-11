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

/**
 * Checks whether an S3 signed URL is expiring within the next day. 
 * 
 * @param signedUrl S3 signed URL
 * @returns whether the URL is expiring soon
 */
export const isExpiringSoon = (signedUrl: string): boolean => {
  const parsed = new URL(signedUrl);
  const now = new Date();
  const expires = new Date(Number(parsed.searchParams.get('Expires') || 0) * 1000);
  return (expires.getTime() - now.getTime()) < 1000 * 60 * 60 * 24; // A day in milliseconds
};

/**
 * Suggests a suffixed name in case if a file with the same name is present inside the target folder.
 * Useful when moving files as a bulk. 
 * 
 * @param fileName Name of the file added to the folder
 * @param siblingNames Names of other files currently in the target folder
 * @returns fileName if no conflicts, otherwise suffixed name (counter)
 */
export const suggestName = (fileName: string, siblingNames: string[]): string => {
  if (!siblingNames.includes(fileName)) {
    return fileName;
  }

  let i = 1;
  while (siblingNames.includes(`${fileName}-${i}`)) {
    i++;
  }

  return `${fileName}-${i}`;
};
