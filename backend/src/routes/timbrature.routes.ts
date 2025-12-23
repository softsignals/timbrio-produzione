import { Router } from 'express';
import {
  getMyTimbrature,
  getAllTimbrature,
  getTodayTimbrature,
  getCurrentTimbratura,
  createTimbratura,
  registraUscita,
  registraPausa,
  getStatistiche,
  timbraturaQR,
  updateTimbratura,
  deleteTimbratura,
} from '../controllers/timbrature.controller';
import { authenticate, requireManager, requireReceptionist } from '../middleware/auth';

const router = Router();

// Routes utente
router.get('/me', authenticate, getMyTimbrature);
router.get('/current', authenticate, getCurrentTimbratura);
router.post('/entrata', authenticate, createTimbratura);
router.post('/uscita', authenticate, registraUscita);
router.post('/pausa', authenticate, registraPausa);
router.get('/statistiche', authenticate, getStatistiche);

// Routes manager/admin
router.get('/', authenticate, requireManager, getAllTimbrature);
router.get('/today', authenticate, getTodayTimbrature);

// Routes receptionist (QR)
router.post('/qr', authenticate, requireReceptionist, timbraturaQR);

// Routes admin
router.put('/:id', authenticate, requireManager, updateTimbratura);
router.delete('/:id', authenticate, requireManager, deleteTimbratura);

export default router;
