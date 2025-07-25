import { Transaction } from './transaction.model';

// ✅ Enum pour les types de litige
export enum TypeLitige {
  FRAUDE = 'FRAUDE',
  ERREUR_MONTANT = 'ERREUR_MONTANT', 
  TRANSACTION_NON_AUTORISEE = 'TRANSACTION_NON_AUTORISEE',
  AUTRE = 'AUTRE'
}

// ✅ Enum pour les statuts de litige
export enum StatutLitige {
  OUVERT = 'OUVERT',
  EN_COURS = 'EN_COURS',
  RESOLU = 'RESOLU',
  FERME = 'FERME',
  VU = 'VU'
}

export interface Litige {
  id: number;
  transaction: Transaction;
  
  // ✅ AJOUT MANQUANT : La propriété type avec votre style d'enum
  type: TypeLitige;
  
  statut: StatutLitige;
  dateCreation: string;
  description?: string;

  declarePar?: {
    id: number;
    nom: string;
    institution?: {
      id: number;
      nom: string;
    };
  };

  banqueDeclarante?: {
    id: number;
    nom: string;
  };

  // ✅ Champ fourni par le backend
  institutionDeclarantNom?: string;
}

// ✅ Interface pour les litiges reçus (LitigeResponseDTO)
export interface LitigeRecu {
  id: number;
  type: TypeLitige;
  statut: StatutLitige;
  description?: string;
  dateCreation: string;
  banqueDeclaranteNom: string;
  institutionDeclarantNom: string;
}