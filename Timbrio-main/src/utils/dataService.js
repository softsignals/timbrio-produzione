/**
 * Servizio per la gestione dei dati dell'applicazione
 */

import usersData from '../data/users.json';

/**
 * Ottiene tutti gli utenti
 * @returns {Array} Lista degli utenti
 */
export const getAllUsers = () => {
  return usersData.users;
};

/**
 * Ottiene un utente per ID
 * @param {string} userId - ID dell'utente
 * @returns {Object|null} Utente trovato o null
 */
export const getUserById = (userId) => {
  return usersData.users.find(user => user.id === userId) || null;
};

/**
 * Ottiene tutte le timbrature
 * @returns {Array} Lista delle timbrature
 */
export const getAllTimbrature = () => {
  return usersData.timbrature;
};

/**
 * Ottiene le timbrature di un utente specifico
 * @param {string} userId - ID dell'utente
 * @returns {Array} Lista delle timbrature dell'utente
 */
export const getTimbratureByUser = (userId) => {
  return usersData.timbrature.filter(t => t.userId === userId);
};

/**
 * Ottiene le timbrature di una data specifica
 * @param {string} date - Data nel formato YYYY-MM-DD
 * @returns {Array} Lista delle timbrature della data
 */
export const getTimbratureByDate = (date) => {
  return usersData.timbrature.filter(t => t.data === date);
};

/**
 * Ottiene le timbrature di un utente in un range di date
 * @param {string} userId - ID dell'utente
 * @param {string} startDate - Data inizio (YYYY-MM-DD)
 * @param {string} endDate - Data fine (YYYY-MM-DD)
 * @returns {Array} Lista delle timbrature filtrate
 */
export const getTimbratureByUserAndDateRange = (userId, startDate, endDate) => {
  return usersData.timbrature.filter(t => 
    t.userId === userId && 
    t.data >= startDate && 
    t.data <= endDate
  );
};

