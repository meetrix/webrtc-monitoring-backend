import { Request, Response, NextFunction } from 'express';
import { FolderType } from '../../../models/FileSystemEntity';

// Fetch flat file system - GET /
export const fetchFileSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const fileSystem = req.user.fileSystem || [];

    res.status(200).json({ success: true, data: { fileSystem } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

// Create a folder - POST /
export const createFolder = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    const { name, parentId = null }: { name: string; parentId: string } = req.body;

    // Name and parentId (null for root level) must be defined
    if (!name || typeof name !== 'string' || name.length <= 0) {
      res.status(400).json({ success: false, error: 'Folder name must be provided.' });
      return;
    }

    // The fileSystem might not be defined; Fix it
    if (!req.user.fileSystem) {
      req.user.fileSystem = [];
    }

    // Check whether the parent folder already contains a file or folder by the same name
    if (req.user.fileSystem
      .filter((f) => f.name === name && f.parentId === parentId)
      .length > 0) {

      res.status(400).json({ success: false, error: 'File/folder already exists.' });
      return;
    }

    req.user.fileSystem.push({ type: 'Folder', name, parentId });
    const folder = (await req.user.save())
      .fileSystem.find((f) => f.name === name && f.parentId === parentId);

    res.status(201).json({ success: true, data: { folder } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

const detectCycles = (
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

// Update folder details, move folders around - POST /:id
export const updateFolder = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such source folder exists.' });
      return;
    }

    const { id } = req.params;

    const fse = req.user.fileSystem.find((f) => f._id === id);
    if (!fse) {
      res.status(404).json({ success: false, error: 'No such source folder exists.' });
      return;
    }

    const { name, parentId } = req.body;

    // Rename the folder if needed
    if (!!name && typeof name === 'string') {
      fse.name = name;
    }

    // Move the folder if needed
    if (!!parentId && typeof parentId === 'string') {

      // Destination folder must exist
      const folders = req.user.fileSystem.filter((f) => f.type === 'Folder') as FolderType[];
      if (folders.filter((d) => d._id === parentId).length !== 1) {
        res.status(400).json({ success: false, error: 'No such destination folder exists.' });
        return;
      }

      // Cycle detection 
      const cyclesDetected = detectCycles(folders, fse._id, parentId);
      if (cyclesDetected) {
        res.status(400).json({
          success: false,
          error: 'Cannot move a folder into itself or its children.'
        });
        return;
      }

      fse.parentId = parentId;
    }

    const folder = (await req.user.save())
      .fileSystem.find((f) => f._id = fse._id);

    res.status(200).json({ success: true, data: { folder } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Delete folder, and its contents - DELETE /:id
export const deleteFolder = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export const updateFile = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};