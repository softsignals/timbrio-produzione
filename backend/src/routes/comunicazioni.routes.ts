import { Router } from 'express';
import multer from 'multer';
import {
  getMyComunicazioni,
  getAllComunicazioni,
  getComunicazioneById,
  createComunicazione,
  updateComunicazione,
  deleteComunicazione,
  markAsRead,
  getLetture,
  countUnread,
  downloadFile,
  getStats,
} from '../controllers/comunicazioni.controller';
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'));
    }
  },
});

// Routes utente
router.get('/me', authenticate, getMyComunicazioni);
router.get('/unread/count', authenticate, countUnread);
router.get('/:id', authenticate, getComunicazioneById);
router.get('/:id/download', authenticate, downloadFile);
router.put('/:id/read', authenticate, markAsRead);

// Routes manager/admin
router.get('/', authenticate, requireManager, getAllComunicazioni);
router.post('/', authenticate, requireManager, upload.single('file'), createComunicazione);
router.put('/:id', authenticate, requireManager, updateComunicazione);
router.get('/:id/letture', authenticate, requireManager, getLetture);
router.get('/admin/stats', authenticate, requireManager, getStats);

// Routes admin only
router.delete('/:id', authenticate, requireAdmin, deleteComunicazione);

export default router;





