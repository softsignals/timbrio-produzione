import { Response } from 'express';
import { comunicazioneRepository } from '../repositories/ComunicazioneRepository';
import { userRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../types';

// Ottieni comunicazioni per l'utente corrente
export const getMyComunicazioni = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    // Ottieni dettagli utente completi
    const userDetails = await userRepository.findById(req.user.id);
    if (!userDetails) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    const comunicazioni = await comunicazioneRepository.findForUser({
      id: req.user.id,
      ruolo: req.user.ruolo,
      reparto: userDetails.reparto,
      sede: userDetails.sede,
    });

    res.status(200).json({
      success: true,
      data: comunicazioni,
    });
  } catch (error: any) {
    console.error('Errore get my comunicazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle comunicazioni',
    });
  }
};

// Ottieni tutte le comunicazioni (admin/manager)
export const getAllComunicazioni = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const comunicazioni = await comunicazioneRepository.findAll();

    // Aggiungi conteggio letture per ogni comunicazione
    const comunicazioniConStats = await Promise.all(
      comunicazioni.map(async (com) => {
        const countLetture = await comunicazioneRepository.countLetture(com.id);
        return { ...com, count_letture: countLetture };
      })
    );

    res.status(200).json({
      success: true,
      data: comunicazioniConStats,
    });
  } catch (error: any) {
    console.error('Errore get all comunicazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle comunicazioni',
    });
  }
};

// Ottieni comunicazione per ID
export const getComunicazioneById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;
    const comunicazione = await comunicazioneRepository.findById(id);

    if (!comunicazione) {
      res.status(404).json({
        success: false,
        error: 'Comunicazione non trovata',
      });
      return;
    }

    // Aggiungi info lettura
    const letta = await comunicazioneRepository.isReadByUser(id, req.user.id);
    const countLetture = await comunicazioneRepository.countLetture(id);

    res.status(200).json({
      success: true,
      data: { ...comunicazione, letta, count_letture: countLetture },
    });
  } catch (error: any) {
    console.error('Errore get comunicazione by id:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero della comunicazione',
    });
  }
};

// Crea nuova comunicazione (admin/manager)
export const createComunicazione = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const file = req.file;
    const {
      titolo,
      descrizione,
      tipo,
      priorita,
      destinatari_ruoli,
      destinatari_reparti,
      destinatari_sedi,
      destinatari_utenti,
      pubblicato,
      data_scadenza,
      richiede_conferma,
    } = req.body;

    if (!titolo || !tipo) {
      res.status(400).json({
        success: false,
        error: 'Titolo e tipo sono obbligatori',
      });
      return;
    }

    let filePath: string | undefined;
    let mimeType: string | undefined;
    let dimensione: number | undefined;

    // Upload file se presente
    if (file) {
      filePath = await comunicazioneRepository.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      mimeType = file.mimetype;
      dimensione = file.size;
    }

    // Parse array fields se sono stringhe JSON
    const parseArrayField = (field: any): string[] | undefined => {
      if (!field) return undefined;
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch {
        return field.split(',').map((s: string) => s.trim());
      }
    };

    const comunicazione = await comunicazioneRepository.create({
      titolo,
      descrizione,
      tipo,
      priorita: priorita || 'normale',
      file_path: filePath,
      mime_type: mimeType,
      dimensione,
      destinatari_ruoli: parseArrayField(destinatari_ruoli),
      destinatari_reparti: parseArrayField(destinatari_reparti),
      destinatari_sedi: parseArrayField(destinatari_sedi),
      destinatari_utenti: parseArrayField(destinatari_utenti),
      pubblicato: pubblicato !== 'false' && pubblicato !== false,
      data_scadenza,
      richiede_conferma: richiede_conferma === 'true' || richiede_conferma === true,
      creato_da: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Comunicazione creata con successo',
      data: comunicazione,
    });
  } catch (error: any) {
    console.error('Errore create comunicazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione della comunicazione',
    });
  }
};

// Aggiorna comunicazione (admin/manager)
export const updateComunicazione = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const comunicazione = await comunicazioneRepository.update(id, updateData);

    if (!comunicazione) {
      res.status(404).json({
        success: false,
        error: 'Comunicazione non trovata',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comunicazione aggiornata',
      data: comunicazione,
    });
  } catch (error: any) {
    console.error('Errore update comunicazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento della comunicazione',
    });
  }
};

// Elimina comunicazione (admin)
export const deleteComunicazione = async (req: AuthRequest, res: Response): Promise<void> => {
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
    await comunicazioneRepository.delete(id);

    res.status(200).json({
      success: true,
      message: 'Comunicazione eliminata',
    });
  } catch (error: any) {
    console.error('Errore delete comunicazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione della comunicazione',
    });
  }
};

// Segna comunicazione come letta
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    const comunicazione = await comunicazioneRepository.findById(id);
    if (!comunicazione) {
      res.status(404).json({
        success: false,
        error: 'Comunicazione non trovata',
      });
      return;
    }

    const lettura = await comunicazioneRepository.markAsRead(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Comunicazione segnata come letta',
      data: lettura,
    });
  } catch (error: any) {
    console.error('Errore mark as read:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento',
    });
  }
};

// Ottieni conferme di lettura (admin/manager)
export const getLetture = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const comunicazione = await comunicazioneRepository.findById(id);
    if (!comunicazione) {
      res.status(404).json({
        success: false,
        error: 'Comunicazione non trovata',
      });
      return;
    }

    const letture = await comunicazioneRepository.getLetture(id);
    const destinatari = await comunicazioneRepository.getDestinatari(id);

    // Costruisci lista con stato lettura per ogni destinatario
    const destinatariConStato = destinatari.map(user => {
      const lettura = letture.find(l => l.user_id === user.id);
      return {
        user,
        letto: !!lettura,
        letto_il: lettura?.letto_il,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totale_destinatari: destinatari.length,
        totale_letture: letture.length,
        percentuale: destinatari.length > 0 
          ? Math.round((letture.length / destinatari.length) * 100) 
          : 0,
        destinatari: destinatariConStato,
      },
    });
  } catch (error: any) {
    console.error('Errore get letture:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle conferme di lettura',
    });
  }
};

// Conta comunicazioni non lette
export const countUnread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const userDetails = await userRepository.findById(req.user.id);
    if (!userDetails) {
      res.status(404).json({ success: false, error: 'Utente non trovato' });
      return;
    }

    const count = await comunicazioneRepository.countUnread({
      id: req.user.id,
      ruolo: req.user.ruolo,
      reparto: userDetails.reparto,
      sede: userDetails.sede,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error('Errore count unread:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il conteggio',
    });
  }
};

// Download file allegato
export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;
    const comunicazione = await comunicazioneRepository.findById(id);

    if (!comunicazione) {
      res.status(404).json({
        success: false,
        error: 'Comunicazione non trovata',
      });
      return;
    }

    if (!comunicazione.file_path) {
      res.status(404).json({
        success: false,
        error: 'Nessun file allegato',
      });
      return;
    }

    const signedUrl = await comunicazioneRepository.getFileUrl(comunicazione.file_path, 3600);

    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        titolo: comunicazione.titolo,
        mime_type: comunicazione.mime_type,
      },
    });
  } catch (error: any) {
    console.error('Errore download file:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il download del file',
    });
  }
};

// Statistiche comunicazioni (admin/manager)
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const stats = await comunicazioneRepository.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Errore get stats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle statistiche',
    });
  }
};





