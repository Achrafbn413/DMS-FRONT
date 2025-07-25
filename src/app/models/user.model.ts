import { Institution } from './institution.model';

// ✅ Enum pour les rôles (même style que vos enums)
export enum RoleUtilisateur {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// ✅ Enum pour les niveaux
export enum NiveauUtilisateur {
  BAS = 'BAS',
  MOYEN = 'MOYEN',
  HAUT = 'HAUT'
}

export interface Utilisateur {
  id?: number;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  enabled: boolean;
  niveaux?: string;  // Pour "MOYEN", "HAUT", etc.
  institution?: Institution;
  token?: string;  // Pour stocker le JWT
}