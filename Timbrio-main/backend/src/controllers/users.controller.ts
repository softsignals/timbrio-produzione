import { Response } from 'express';
import { userRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../types';

// Ottieni tutti gli utenti
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    // Solo admin e manager possono vedere tutti gli utenti
    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { ruolo, reparto, attivo, search } = req.query;

    let users;

    if (search) {
      users = await userRepository.search(search as string);
    } else if (ruolo) {
      users = await userRepository.findByRole(ruolo as any);
    } else if (reparto) {
      users = await userRepository.findByReparto(reparto as string);
    } else if (attivo === 'true') {
      users = await userRepository.findActive();
    } else {
      users = await userRepository.findAll();
    }

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Errore get all users:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero degli utenti',
    });
  }
};

// Ottieni utente per ID
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    // Gli utenti possono vedere solo il proprio profilo, admin e manager possono vedere tutti
    if (req.user.id !== id && req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const user = await userRepository.findById(id);

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
    console.error('Errore get user by id:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dell\'utente',
    });
  }
};

// Crea nuovo utente (admin only)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const { nome, cognome, email, password, badge, ruolo, reparto, sede, telefono, paga_oraria } = req.body;

    // Validazione
    if (!nome || !cognome || !email || !password || !badge) {
      res.status(400).json({
        success: false,
        error: 'Nome, cognome, email, password e badge sono obbligatori',
      });
      return;
    }

    // Verifica email unica
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: 'Email già registrata',
      });
      return;
    }

    // Verifica badge unico
    const existingBadge = await userRepository.findByBadge(badge);
    if (existingBadge) {
      res.status(409).json({
        success: false,
        error: 'Badge già in uso',
      });
      return;
    }

    const newUser = await userRepository.create({
      nome,
      cognome,
      email,
      password,
      badge,
      ruolo: ruolo || 'dipendente',
      reparto,
      sede,
      telefono,
      paga_oraria,
    });

    res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      data: newUser,
    });
  } catch (error: any) {
    console.error('Errore create user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione dell\'utente',
    });
  }
};

// Aggiorna utente (admin only o proprio profilo)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const { id } = req.params;

    // Solo admin può modificare altri utenti
    if (req.user.id !== id && req.user.ruolo !== 'admin') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const updateData = req.body;

    // Gli utenti non-admin non possono modificare il proprio ruolo
    if (req.user.ruolo !== 'admin' && updateData.ruolo) {
      delete updateData.ruolo;
    }

    // Se sta aggiornando email, verifica unicità
    if (updateData.email) {
      const existingEmail = await userRepository.findByEmail(updateData.email);
      if (existingEmail && existingEmail.id !== id) {
        res.status(409).json({
          success: false,
          error: 'Email già in uso',
        });
        return;
      }
    }

    // Se sta aggiornando badge, verifica unicità
    if (updateData.badge) {
      const existingBadge = await userRepository.findByBadge(updateData.badge);
      if (existingBadge && existingBadge.id !== id) {
        res.status(409).json({
          success: false,
          error: 'Badge già in uso',
        });
        return;
      }
    }

    const updatedUser = await userRepository.update(id, updateData);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Utente aggiornato con successo',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Errore update user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento dell\'utente',
    });
  }
};

// Disattiva utente (admin only)
export const disableUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Non può disattivare se stesso
    if (req.user.id === id) {
      res.status(400).json({
        success: false,
        error: 'Non puoi disattivare il tuo account',
      });
      return;
    }

    const updatedUser = await userRepository.update(id, { attivo: false });

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Utente disattivato',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Errore disable user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la disattivazione dell\'utente',
    });
  }
};

// Attiva utente (admin only)
export const enableUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const updatedUser = await userRepository.update(id, { attivo: true });

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Utente non trovato',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Utente attivato',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Errore enable user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'attivazione dell\'utente',
    });
  }
};

// Elimina utente (admin only)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Non può eliminare se stesso
    if (req.user.id === id) {
      res.status(400).json({
        success: false,
        error: 'Non puoi eliminare il tuo account',
      });
      return;
    }

    await userRepository.delete(id);

    res.status(200).json({
      success: true,
      message: 'Utente eliminato',
    });
  } catch (error: any) {
    console.error('Errore delete user:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione dell\'utente',
    });
  }
};

// Statistiche utenti
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'manager') {
      res.status(403).json({ success: false, error: 'Non autorizzato' });
      return;
    }

    const totalUsers = await userRepository.count();
    const activeUsers = (await userRepository.findActive()).length;
    const dipendenti = (await userRepository.findByRole('dipendente')).length;
    const managers = (await userRepository.findByRole('manager')).length;

    res.status(200).json({
      success: true,
      data: {
        totale: totalUsers,
        attivi: activeUsers,
        inattivi: totalUsers - activeUsers,
        dipendenti,
        managers,
      },
    });
  } catch (error: any) {
    console.error('Errore get user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle statistiche',
    });
  }
};
