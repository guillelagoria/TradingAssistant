import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: 400
        }
      });
      return;
    }

    // Build the URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

export const deleteImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Filename is required',
          statusCode: 400
        }
      });
      return;
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../uploads', sanitizedFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          statusCode: 404
        }
      });
      return;
    }

    // Delete the file
    await fs.unlink(filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    next(error);
  }
};