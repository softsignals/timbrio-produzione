/**
 * Utilità per validazione form
 */

/**
 * Valida un indirizzo email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email richiesta' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email non valida' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida una password
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { isValid: false, error: 'Password richiesta' };
  }
  
  if (password.length < minLength) {
    return { 
      isValid: false, 
      error: `La password deve essere di almeno ${minLength} caratteri` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un campo obbligatorio
 */
export const validateRequired = (value, fieldName = 'Campo') => {
  if (!value || value.toString().trim() === '') {
    return { isValid: false, error: `${fieldName} richiesto` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un orario nel formato HH:MM
 */
export const validateTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!time) {
    return { isValid: false, error: 'Orario richiesto' };
  }
  
  if (!timeRegex.test(time)) {
    return { isValid: false, error: 'Formato orario non valido (HH:MM)' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un numero
 */
export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Deve essere un numero valido' };
  }
  
  if (min !== null && num < min) {
    return { isValid: false, error: `Il valore minimo è ${min}` };
  }
  
  if (max !== null && num > max) {
    return { isValid: false, error: `Il valore massimo è ${max}` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Valida un form completo
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(fieldName => {
    const value = fields[fieldName];
    const fieldRules = rules[fieldName];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
        break;
      }
    }
  });
  
  return { isValid, errors };
};

