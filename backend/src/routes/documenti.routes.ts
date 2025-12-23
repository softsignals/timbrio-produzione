import { Router } from 'express';
import multer from 'multer';
import {
  getMyDocumenti,
  getAllDocumenti,
  getDocumentoById,
  uploadDocumento,
  downloadDocumento,
  markAsRead,
  markAllAsRead,
  deleteDocumento,
  countNew,
} from '../controllers/documenti.controller';
import { authenticate, requireManager, requireAdmin } from '../middleware/auth';

const router = Router();

// Configurazione multer per upload in memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'));
    }
  },
});

// Routes utente
router.get('/me', authenticate, getMyDocumenti);
router.get('/new/count', authenticate, countNew);
router.put('/read-all', authenticate, markAllAsRead);
router.get('/:id', authenticate, getDocumentoById);
router.get('/:id/download', authenticate, downloadDocumento);
router.put('/:id/read', authenticate, markAsRead);

// Routes manager/admin
router.get('/', authenticate, requireManager, getAllDocumenti);
router.post('/', authenticate, requireManager, upload.single('file'), uploadDocumento);

// Routes admin only
router.delete('/:id', authenticate, requireAdmin, deleteDocumento);

export default router;

