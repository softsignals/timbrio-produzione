import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../types';

// Configurazione JWT
const JWT_SECRET = process.env.JWT_SECRET || 'timbrio_secret_key_2024';
const JWT_OPTIONS: SignOptions = {
  expiresIn: '7d',
};

// Login utente
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email e password sono obbligatori',
      });
      return;
    }

    // Trova utente con password
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Credenziali non valide',
      });
      return;
    }

    // Verifica password
    const isPasswordValid = await userRepository.comparePassword(password, user.password || '');

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Credenziali non valide',
      });
      return;
    }

    // Verifica che l'utente sia attivo
    if (!user.attivo) {
      res.status(403).json({
        success: false,
        error: 'Account disattivato. Contatta l\'amministratore.',
      });
      return;
    }

    // Genera JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo,
      },
      JWT_SECRET,
      JWT_OPTIONS
    );

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error: any) {
    console.error('Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il login',
    });
  }
};

// Registrazione utente
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, cognome, email, password, badge, ruolo, reparto, sede } = req.body;

    // Validazione input
    if (!nome || !cognome || !email || !password || !badge) {
      res.status(400).json({
        success: false,
        error: 'Nome, cognome, email, password e badge sono obbligatori',
      });
      return;
    }

    // Verifica se email già esistente
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: 'Email già registrata',
      });
      return;
    }

    // Verifica se badge già esistente
    const existingBadge = await userRepository.findByBadge(badge);
    if (existingBadge) {
      res.status(409).json({
        success: false,
        error: 'Badge già in uso',
      });
      return;
    }

    // Crea utente
    const newUser = await userRepository.create({
      nome,
      cognome,
      email,
      password,
      badge,
      ruolo: ruolo || 'dipendente',
      reparto,
      sede,
    });

    // Genera JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        ruolo: newUser.ruolo,
      },
      JWT_SECRET,
      JWT_OPTIONS
    );

    res.status(201).json({
      success: true,
      message: 'Registrazione effettuata con successo',
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error: any) {
    console.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione',
    });
  }
};

// Ottieni profilo utente corrente
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Non autenticato',
      });
      return;
    }

    const user = await userRepository.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Errore get profile:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del profilo',
    });
  }
};

// Aggiorna profilo utente corrente
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Non autenticato',
      });
      return;
    }

    const { nome, cognome, telefono, foto_profilo } = req.body;

    const updatedUser = await userRepository.update(req.user.id, {
      nome,
      cognome,
      telefono,
      foto_profilo,
    });

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Errore update profile:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento del profilo',
    });
  }
};

// Cambia password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Non autenticato',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Password attuale e nuova password sono obbligatorie',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nuova password deve essere di almeno 6 caratteri',
      });
      return;
    }

    // Verifica password attuale
    const user = await userRepository.findByEmailWithPassword(req.user.email);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    const isPasswordValid = await userRepository.comparePassword(currentPassword, user.password || '');
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Password attuale non corretta',
      });
      return;
    }

    // Aggiorna password
    await userRepository.update(req.user.id, { password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password aggiornata con successo',
    });
  } catch (error: any) {
    console.error('Errore change password:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il cambio password',
    });
  }
};
