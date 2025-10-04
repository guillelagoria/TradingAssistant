import { Router } from 'express';
import multer from 'multer';
import { nt8ImportV2Controller } from '../controllers/nt8ImportV2.controller';
import { authenticate } from '../middleware/auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV and TXT files
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'text/plain' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and TXT files are allowed'));
    }
  },
});

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Preview import - parse and validate without saving
router.post(
  '/preview',
  upload.single('file'),
  (req, res) => nt8ImportV2Controller.preview(req, res)
);

// Execute import - save valid trades to database
router.post(
  '/execute',
  upload.single('file'),
  (req, res) => nt8ImportV2Controller.execute(req, res)
);

export default router;