import { Router } from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

// Upload single image
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  uploadImage
);

// Delete image
router.delete(
  '/image/:filename',
  authenticate,
  deleteImage
);

export default router;