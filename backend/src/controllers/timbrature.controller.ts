import { Response } from 'express';
import { timbraturaRepository } from '../repositories/TimbraturaRepository';
import { userRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../types';

// Ottieni tutte le timbrature dell'utente corrente
export const getMyTimbrature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const timbrature = await timbraturaRepository.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: timbrature,
    });
  } catch (error: any) {
    console.error('Errore get my timbrature:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle timbrature',
    });
  }
};

// Ottieni tutte le timbrature (admin/manager)
export const getAllTimbrature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    // Solo admin e manager possono vedere tutte le timbrature
    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { startDate, endDate, userId } = req.query;

    let timbrature;

    if (startDate && endDate) {
      if (userId) {
        timbrature = await timbraturaRepository.findByPeriod(
          userId as string,
          startDate as string,
          endDate as string
        );
      } else {
        timbrature = await timbraturaRepository.findAllByPeriod(
          startDate as string,
          endDate as string
        );
      }
    } else if (userId) {
      timbrature = await timbraturaRepository.findByUserId(userId as string);
    } else {
      timbrature = await timbraturaRepository.findAll();
    }

    res.status(200).json({
      success: true,
      data: timbrature,
    });
  } catch (error: any) {
    console.error('Errore get all timbrature:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle timbrature',
    });
  }
};

// Ottieni timbrature di oggi
export const getTodayTimbrature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const timbrature = await timbraturaRepository.findTodayTimbrature();

    res.status(200).json({
      success: true,
      data: timbrature,
    });
  } catch (error: any) {
    console.error('Errore get today timbrature:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle timbrature di oggi',
    });
  }
};

// Crea nuova timbratura (entrata)
export const createTimbratura = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { data, entrata, metodo_timbratura, qr_token, commessa, note, user_id } = req.body;

    // Se user_id è specificato (es. timbratura da QR), usa quello
    // Altrimenti usa l'utente corrente
    let targetUserId = req.user.id;

    if (user_id && (req.user.ruolo === 'receptionist' || req.user.ruolo === 'admin')) {
      targetUserId = user_id;
    }

    // Verifica se esiste già una timbratura per oggi
    const oggi = data || new Date().toISOString().split('T')[0];
    const existingTimbratura = await timbraturaRepository.findByUserIdAndDate(targetUserId, oggi);

    if (existingTimbratura) {
      res.status(409).json({
        success: false,
        error: 'Esiste già una timbratura per oggi',
        data: existingTimbratura,
      });
      return;
    }

    // Crea timbratura
    const now = new Date();
    const oraEntrata = entrata || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const timbratura = await timbraturaRepository.create({
      user_id: targetUserId,
      data: oggi,
      entrata: oraEntrata,
      metodo_timbratura: metodo_timbratura || 'qr',
      qr_token,
      commessa,
      note,
    });

    res.status(201).json({
      success: true,
      message: 'Entrata registrata con successo',
      data: timbratura,
    });
  } catch (error: any) {
    console.error('Errore create timbratura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione dell\'entrata',
    });
  }
};

// Registra uscita
export const registraUscita = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { uscita, user_id } = req.body;

    // Se user_id è specificato (es. timbratura da QR), usa quello
    let targetUserId = req.user.id;

    if (user_id && (req.user.ruolo === 'receptionist' || req.user.ruolo === 'admin')) {
      targetUserId = user_id;
    }

    // Trova timbratura aperta di oggi
    const oggi = new Date().toISOString().split('T')[0];
    const timbratura = await timbraturaRepository.findByUserIdAndDate(targetUserId, oggi);

    if (!timbratura) {
      res.status(404).json({
        success: false,
        error: 'Nessuna timbratura di entrata trovata per oggi',
      });
      return;
    }

    if (timbratura.uscita) {
      res.status(409).json({
        success: false,
        error: 'Uscita già registrata per oggi',
        data: timbratura,
      });
      return;
    }

    // Aggiorna con uscita
    const now = new Date();
    const oraUscita = uscita || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const updatedTimbratura = await timbraturaRepository.update(timbratura.id, {
      uscita: oraUscita,
    });

    res.status(200).json({
      success: true,
      message: 'Uscita registrata con successo',
      data: updatedTimbratura,
    });
  } catch (error: any) {
    console.error('Errore registra uscita:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione dell\'uscita',
    });
  }
};

// Registra pausa
export const registraPausa = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { tipo } = req.body; // 'inizio' o 'fine'

    // Trova timbratura aperta di oggi
    const oggi = new Date().toISOString().split('T')[0];
    const timbratura = await timbraturaRepository.findByUserIdAndDate(req.user.id, oggi);

    if (!timbratura) {
      res.status(404).json({
        success: false,
        error: 'Nessuna timbratura di entrata trovata per oggi',
      });
      return;
    }

    const now = new Date();
    const ora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let updateData: any = {};

    if (tipo === 'inizio') {
      if (timbratura.pausa_inizio && !timbratura.pausa_fine) {
        res.status(409).json({
          success: false,
          error: 'Pausa già in corso',
        });
        return;
      }
      updateData.pausa_inizio = ora;
    } else if (tipo === 'fine') {
      if (!timbratura.pausa_inizio) {
        res.status(400).json({
          success: false,
          error: 'Nessuna pausa in corso',
        });
        return;
      }
      updateData.pausa_fine = ora;
    }

    const updatedTimbratura = await timbraturaRepository.update(timbratura.id, updateData);

    res.status(200).json({
      success: true,
      message: tipo === 'inizio' ? 'Pausa iniziata' : 'Pausa terminata',
      data: updatedTimbratura,
    });
  } catch (error: any) {
    console.error('Errore registra pausa:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione della pausa',
    });
  }
};

// Ottieni timbratura corrente (di oggi)
export const getCurrentTimbratura = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const oggi = new Date().toISOString().split('T')[0];
    const timbratura = await timbraturaRepository.findByUserIdAndDate(req.user.id, oggi);

    res.status(200).json({
      success: true,
      data: timbratura,
    });
  } catch (error: any) {
    console.error('Errore get current timbratura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero della timbratura corrente',
    });
  }
};

// Ottieni statistiche
export const getStatistiche = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'startDate e endDate sono obbligatori',
      });
      return;
    }

    const stats = await timbraturaRepository.getOreTotaliByPeriod(
      req.user.id,
      startDate as string,
      endDate as string
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Errore get statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle statistiche',
    });
  }
};

// Timbratura QR - per receptionist
export const timbraturaQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { badge, tipo } = req.body; // tipo: 'entrata' o 'uscita'

    if (!badge) {
      res.status(400).json({
        success: false,
        error: 'Badge obbligatorio',
      });
      return;
    }

    // Trova utente per badge
    const user = await userRepository.findByBadge(badge);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato con questo badge',
      });
      return;
    }

    const oggi = new Date().toISOString().split('T')[0];
    const now = new Date();
    const ora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Cerca timbratura esistente
    const existingTimbratura = await timbraturaRepository.findByUserIdAndDate(user.id, oggi);

    if (tipo === 'entrata') {
      if (existingTimbratura) {
        res.status(409).json({
          success: false,
          error: 'Entrata già registrata per oggi',
          data: existingTimbratura,
          user: { nome: user.nome, cognome: user.cognome },
        });
        return;
      }

      const timbratura = await timbraturaRepository.create({
        user_id: user.id,
        data: oggi,
        entrata: ora,
        metodo_timbratura: 'qr',
      });

      res.status(201).json({
        success: true,
        message: `Entrata registrata per ${user.nome} ${user.cognome}`,
        data: timbratura,
        user: { nome: user.nome, cognome: user.cognome },
      });
    } else if (tipo === 'uscita') {
      if (!existingTimbratura) {
        res.status(404).json({
          success: false,
          error: 'Nessuna entrata registrata per oggi',
          user: { nome: user.nome, cognome: user.cognome },
        });
        return;
      }

      if (existingTimbratura.uscita) {
        res.status(409).json({
          success: false,
          error: 'Uscita già registrata per oggi',
          data: existingTimbratura,
          user: { nome: user.nome, cognome: user.cognome },
        });
        return;
      }

      const timbratura = await timbraturaRepository.update(existingTimbratura.id, {
        uscita: ora,
      });

      res.status(200).json({
        success: true,
        message: `Uscita registrata per ${user.nome} ${user.cognome}`,
        data: timbratura,
        user: { nome: user.nome, cognome: user.cognome },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Tipo deve essere "entrata" o "uscita"',
      });
    }
  } catch (error: any) {
    console.error('Errore timbratura QR:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la timbratura QR',
    });
  }
};

// Modifica timbratura (admin only)
export const updateTimbratura = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const timbratura = await timbraturaRepository.update(id, updateData);

    if (!timbratura) {
      res.status(404).json({
        success: false,
        error: 'Timbratura non trovata',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Timbratura aggiornata',
      data: timbratura,
    });
  } catch (error: any) {
    console.error('Errore update timbratura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento della timbratura',
    });
  }
};

// Elimina timbratura (admin only)
export const deleteTimbratura = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { id } = req.params;

    await timbraturaRepository.delete(id);

    res.status(200).json({
      success: true,
      message: 'Timbratura eliminata',
    });
  } catch (error: any) {
    console.error('Errore delete timbratura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione della timbratura',
    });
  }
};
