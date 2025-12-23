import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';

interface JWTPayload {
  id: string;
  email: string;
  ruolo: UserRole;
  iat: number;
  exp: number;
}

// Middleware di autenticazione
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token non fornito',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'timbrio_secret_key_2024';

    const decoded = jwt.verify(token, secret) as JWTPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      ruolo: decoded.ruolo,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token scaduto',
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Token non valido',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Errore durante l\'autenticazione',
    });
  }
};

// Middleware per verificare ruolo admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Non autenticato',
    });
    return;
  }

  if (req.user.ruolo !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Richiesto ruolo admin',
    });
    return;
  }

  next();
};

// Middleware per verificare ruolo manager o admin
export const requireManager = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Non autenticato',
    });
    return;
  }

  if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
    res.status(403).json({
      success: false,
      error: 'Richiesto ruolo manager o admin',
    });
    return;
  }

  next();
};

// Middleware per verificare ruolo receptionist
export const requireReceptionist = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Non autenticato',
    });
    return;
  }

  if (req.user.ruolo !== 'receptionist' && req.user.ruolo !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Richiesto ruolo receptionist o admin',
    });
    return;
  }

  next();
};

// Middleware per verificare ruoli specifici
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Non autenticato',
      });
      return;
    }

    if (!roles.includes(req.user.ruolo)) {
      res.status(403).json({
        success: false,
        error: `Richiesto uno dei seguenti ruoli: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
