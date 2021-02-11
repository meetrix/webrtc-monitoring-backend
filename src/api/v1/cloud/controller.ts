import { Request, Response, NextFunction } from 'express';

import { FolderType } from '../../../models/FileSystemEntity';
import { detectCycles } from './util';

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
    const name = req.body.name as string;
    const parentId = req.body.parentId || null;
    // Name and parentId (null for root level) must be defined
    if (!name || typeof name !== 'string' || name.length <= 0) {
      res.status(400).json({ success: false, error: 'Folder name must be provided.' });
      return;
    }

    // The fileSystem might not be defined; Fix it
    if (!req.user.fileSystem) {
      req.user.fileSystem = [];
    }

    const parent = parentId ? req.user.fileSystem.find((f) => f._id === parentId) : null;
    if (parent === undefined) { // null => orphan/root
      res.status(400).json({ success: false, error: 'Parent folder not found.' });
      return;
    }

    // Check whether the parent folder already contains a file or folder by the same name
    if (req.user.fileSystem
      .filter((f) => f.name === name && f.parentId === parentId)
      .length > 0) {

      res.status(400).json({ success: false, error: 'File/folder already exists.' });
      return;
    }

    const provider = parent
      ? parent.provider
      : (['IDB', 'S3'].includes(req.body.provider) ? req.body.provider : 'IDB');

    req.user.fileSystem.push({ type: 'Folder', name, parentId, provider });
    const folder = (await req.user.save())
      .fileSystem.find((f) => f.name === name && f.parentId === parentId);

    res.status(201).json({ success: true, data: { folder } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

// Update folder details, move folders around - POST /:id
export const updateFolder = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    // No file system defined yet
    if (!req.user.fileSystem) {
      res.status(404).json({ success: false, error: 'No such source folder exists.' });
      return;
    }

    const { id } = req.params;

    const source = req.user.fileSystem.find((f) => f._id === id);
    // Folder does not exist
    if (!source) {
      res.status(404).json({ success: false, error: 'No such source folder exists.' });
      return;
    }

    const { name, parentId } = req.body;
    const shouldRename = !!name && typeof name === 'string';
    const shouldMove = parentId === null || !!parentId && typeof parentId === 'string';

    const folders = req.user.fileSystem
      .filter((f) => f.type === 'Folder' && f.provider === source.provider) as FolderType[];

    if (shouldMove) {
      // Cycle detection and destination folder validations are not needed when moving into roow folder
      if (parentId !== null) {
        // Destination folder must exist
        const destination = folders.find((d) => d._id === parentId);
        if (!destination) {
          res.status(400).json({ success: false, error: 'No such destination folder exists.' });
          return;
        }

        // Cycle detection 
        const cyclesDetected = detectCycles(folders, source._id, parentId);
        if (cyclesDetected) {
          res.status(400).json({
            success: false,
            error: 'Cannot move a folder into itself or its children.'
          });
          return;
        }
      }

      // The new parent folder shouldn't have a folder with the same name (or new name if given)
      const nameExists = folders
        .filter((d) => d.name === (shouldRename ? name : source.name) && d.parentId === parentId)
        .length > 0;
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: `Destination folder already contains a folder by the same name: ${name || source.name}.`
        });
        return;
      }

      if (shouldRename) {
        source.name = name;
      }

      source.parentId = parentId;
    } else if (shouldRename) {
      // The parent folder shouldn't have a folder with the provided name
      const nameExists = folders
        .filter((d) => d.name === name && d.parentId === source.parentId)
        .length > 0;
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: `Destination folder already contains a folder by the same name: ${name}.`
        });
        return;
      }

      source.name = name;
    }

    const folder = (await req.user.save())
      .fileSystem.find((f) => f._id = source._id);

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
