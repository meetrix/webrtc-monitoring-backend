import { Request, Response, NextFunction } from 'express';

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
      res.status(400).json({ success: false, error: 'Folder name must be provided. ' });
      return;
    }

    // The fileSystem might not be defined; Fix it
    if (!req.user.fileSystem) {
      req.user.fileSystem = [];
    }

    // Check whether the parent folder already contains a file or folder by the same name
    if (req.user.fileSystem
      .filter((fse) => fse.parentId === parentId && fse.name === name)
      .length > 0) {
        res.status(400).json({ success: false, error: 'File/folder already exists. ' });
        return;
    }

    req.user.fileSystem.push({ type: 'Folder', name, parentId });
    req.user.save();

    res.status(201).json({ success: true });
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
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