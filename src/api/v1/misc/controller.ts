import { Request, Response, NextFunction } from 'express';
export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
