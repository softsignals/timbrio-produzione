import express, { Application } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Carica variabili ambiente dalla root del progetto (per Expo)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback: cartella backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Fallback: default
dotenv.config();

// Crea applicazione Express
const app: Application = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware di sicurezza
app.use(helmet());

// Configurazione CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'];
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(cors({
  origin: (origin, callback) => {
    // In development, permetti tutte le origini
    if (isDevelopment || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorizzato da CORS'));
    }
  },
  credentials: true,
}));

// Middleware per parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compressione risposta
app.use(compression());

// Logging richieste
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minuti
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server Timbrio DEMO attivo',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0-demo',
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import timbratureRoutes from './routes/timbrature.routes';
import usersRoutes from './routes/users.routes';
import documentiRoutes from './routes/documenti.routes';
import comunicazioniRoutes from './routes/comunicazioni.routes';

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/timbrature', timbratureRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documenti', documentiRoutes);
app.use('/api/comunicazioni', comunicazioniRoutes);

// Gestione errori 404
app.use(notFound);

// Gestione errori globale
app.use(errorHandler);

// Funzione per avviare il server
const startServer = async (): Promise<void> => {
  try {
    // Connetti al database
    await connectDatabase();
    
    // Avvia il server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 Server Timbrio DEMO avviato con successo!');
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL locale: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
      console.log('📦 Database: Supabase (PostgreSQL)');
      console.log('📁 Storage: Supabase Storage\n');
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

// Avvia il server
startServer();

export default app;
