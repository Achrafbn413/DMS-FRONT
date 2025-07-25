import { Institution } from './institution.model';

// ✅ Enum pour les statuts de transaction (même style que vos enums)
export enum StatutTransaction {
  NORMALE = 'NORMALE',
  AVEC_LITIGE = 'AVEC_LITIGE',
  SUSPENDUE = 'SUSPENDUE',
  ANNULEE = 'ANNULEE'
}

export interface Transaction {
  id?: number;
  reference: string;
  montant: number;
  dateTransaction: string;
  type: string;
  statut: StatutTransaction;
  litige: boolean;
  banqueEmettrice?: Institution;
  banqueAcquereuse?: Institution;

  // ✅ Champ temporaire pour affichage du nom de la banque déclarante
  banqueDeclaranteNom?: string;
}

// ✅ Interface pour les données SATIM - CORRIGÉE avec champs banque
export interface SatimTransactionResponse {
  strCode: number;
  strRecoCode: string;
  strRecoNumb: number;
  strOperCode: string;
  strProcDate: string;
  strTermIden: string;
  // ✅ AJOUT DES CHAMPS MANQUANTS
  strIssuBanCode: string;    // Code banque émettrice
  strAcquBanCode: string;    // Code banque acquéreuse
}

// ✅ Interface pour les transactions enrichies avec métadonnées
export interface TransactionWithMeta extends Transaction {
  satimData?: {
    strCode: number;
    strTermIden: string;
  };
}