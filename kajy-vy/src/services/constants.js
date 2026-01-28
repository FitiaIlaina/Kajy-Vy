
export const SERVER_URL = __DEV__ 
  
   ? 'http://localhost:5000' 
  : 'https://votre-api-production.com';

// Clés de stockage AsyncStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USERNAME: 'username',
  USER_DATA: 'user_data',
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  INVALID_CREDENTIALS: 'Identifiants invalides',
  SESSION_EXPIRED: 'Session expirée, veuillez vous reconnecter',
  REQUIRED_FIELDS: 'Veuillez remplir tous les champs obligatoires',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 6 caractères',
};