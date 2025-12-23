import { Request, Response, NextFunction } from 'express';

/**
 * Middleware per gestire gli errori dell'applicazione
 * Aggiornato per Supabase/PostgreSQL
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Errore:', err);
  
  // Errore di validazione (campo mancante o non valido)
  if (err.name === 'ValidationError' || err.type === 'validation') {
    res.status(400).json({
      success: false,
      error: 'Errore di validazione',
      details: err.message,
    });
    return;
  }
  
  // Errore PostgreSQL: violazione chiave unica (duplicato)
  if (err.code === '23505') {
    // Estrai il nome del campo dal messaggio di errore
    const match = err.detail?.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'campo';
    res.status(409).json({
      success: false,
      error: `${field} già esistente`,
    });
    return;
  }
  
  // Errore PostgreSQL: violazione foreign key
  if (err.code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Riferimento non valido',
    });
    return;
  }
  
  // Errore PostgreSQL: violazione check constraint
  if (err.code === '23514') {
    res.status(400).json({
      success: false,
      error: 'Valore non valido',
    });
    return;
  }
  
  // Errore Supabase: record non trovato
  if (err.code === 'PGRST116') {
    res.status(404).json({
      success: false,
      error: 'Risorsa non trovata',
    });
    return;
  }
  
  // Errore JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token non valido o scaduto',
    });
    return;
  }
  
  // Errore generico
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware per gestire route non trovate
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route non trovata: ${req.method} ${req.originalUrl}`,
  });
};
