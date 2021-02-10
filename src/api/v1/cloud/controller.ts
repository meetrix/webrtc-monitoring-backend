import { Request, Response, NextFunction } from 'express';

// Fetch flat file system - GET /
export const fetchFileSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {

  try {
    console.log(req.user);
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

    res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
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