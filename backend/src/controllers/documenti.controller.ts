import { Response } from 'express';
import { documentoRepository } from '../repositories/DocumentoRepository';
import { AuthRequest } from '../types';

// Ottieni documenti dell'utente corrente
export const getMyDocumenti = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const documenti = await documentoRepository.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: documenti,
    });
  } catch (error: any) {
    console.error('Errore get my documenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei documenti',
    });
  }
};

// Ottieni tutti i documenti (admin/manager)
export const getAllDocumenti = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { tipo, anno, mese, userId } = req.query;

    let documenti;

    if (userId) {
      documenti = await documentoRepository.findByUserId(userId as string);
    } else if (tipo) {
      documenti = await documentoRepository.findByTipo(tipo as string);
    } else if (anno) {
      documenti = await documentoRepository.findByAnnoMese(
        parseInt(anno as string),
        mese as string
      );
    } else {
      documenti = await documentoRepository.findAll();
    }

    res.status(200).json({
      success: true,
      data: documenti,
    });
  } catch (error: any) {
    console.error('Errore get all documenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei documenti',
    });
  }
};

// Ottieni documento per ID
export const getDocumentoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    const documento = await documentoRepository.findById(id);

    if (!documento) {
      res.status(404).json({
        success: false,
        error: 'Documento non trovato',
      });
      return;
    }

    // Verifica autorizzazione
    if (
      documento.user_id !== req.user.id &&
      req.user.ruolo !== 'admin' &&
      req.user.ruolo !== 'manager'
    ) {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    res.status(200).json({
      success: true,
      data: documento,
    });
  } catch (error: any) {
    console.error('Errore get documento by id:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del documento',
    });
  }
};

// Carica nuovo documento (admin/manager)
export const uploadDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
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
    if (!file) {
      res.status(400).json({
        success: false,
        error: 'Nessun file caricato',
      });
      return;
    }

    const { user_id, nome, tipo, categoria, mese, anno, importo } = req.body;

    if (!user_id || !nome || !tipo) {
      res.status(400).json({
        success: false,
        error: 'user_id, nome e tipo sono obbligatori',
      });
      return;
    }

    // Upload file su Supabase Storage
    const filePath = await documentoRepository.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Crea record documento
    const documento = await documentoRepository.create({
      user_id,
      nome,
      tipo,
      categoria,
      file_path: filePath,
      mime_type: file.mimetype,
      dimensione: file.size,
      mese,
      anno: anno ? parseInt(anno) : undefined,
      importo: importo ? parseFloat(importo) : undefined,
      caricato_da: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Documento caricato con successo',
      data: documento,
    });
  } catch (error: any) {
    console.error('Errore upload documento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il caricamento del documento',
    });
  }
};

// Scarica documento
export const downloadDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    const documento = await documentoRepository.findById(id);

    if (!documento) {
      res.status(404).json({
        success: false,
        error: 'Documento non trovato',
      });
      return;
    }

    // Verifica autorizzazione
    if (
      documento.user_id !== req.user.id &&
      req.user.ruolo !== 'admin' &&
      req.user.ruolo !== 'manager'
    ) {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    // Genera URL firmato per download
    const signedUrl = await documentoRepository.getFileUrl(documento.file_path, 3600);

    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        nome: documento.nome,
        mime_type: documento.mime_type,
      },
    });
  } catch (error: any) {
    console.error('Errore download documento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il download del documento',
    });
  }
};

// Marca documento come letto
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    const documento = await documentoRepository.findById(id);

    if (!documento) {
      res.status(404).json({
        success: false,
        error: 'Documento non trovato',
      });
      return;
    }

    // Verifica autorizzazione
    if (documento.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const updated = await documentoRepository.markAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Documento marcato come letto',
      data: updated,
    });
  } catch (error: any) {
    console.error('Errore mark as read:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento',
    });
  }
};

// Marca tutti come letti
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    await documentoRepository.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Tutti i documenti marcati come letti',
    });
  } catch (error: any) {
    console.error('Errore mark all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento',
    });
  }
};

// Elimina documento (admin only)
export const deleteDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
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

    await documentoRepository.delete(id);

    res.status(200).json({
      success: true,
      message: 'Documento eliminato',
    });
  } catch (error: any) {
    console.error('Errore delete documento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione del documento',
    });
  }
};

// Conta documenti nuovi
export const countNew = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const count = await documentoRepository.countNew(req.user.id);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error('Errore count new:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il conteggio',
    });
  }
};

