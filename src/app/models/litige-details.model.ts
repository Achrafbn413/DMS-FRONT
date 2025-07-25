import { TypeLitige, StatutLitige } from './litige.model';

// ✅ Interface principale pour les détails complets du litige
export interface LitigeDetailsResponse {
  id: number;
  type: TypeLitige;
  statut: StatutLitige;
  description?: string;
  dateCreation: string; // LocalDate du backend converti en string
  dateResolution?: string;
  banqueDeclaranteNom: string;
  utilisateurCreateur: string;
  justificatifPath?: string;
  dureeDepuisCreationMinutes?: number;
  priorite: string;
  estLu: boolean;
  peutEtreModifie: boolean;
  transaction?: TransactionCompleteDetails;
  historique: string[];
  actions: string[];
}

// ✅ Interface pour les détails complets de la transaction
export interface TransactionCompleteDetails {
  id: number;
  reference: string;
  montant: number;
  dateTransaction: string; // LocalDate du backend converti en string
  type: string;
  statut: string;
  banqueEmettrice?: BanqueInfo;
  banqueAcquereuse?: BanqueInfo;
  satimData?: SatimDataDTO;
}

// ✅ Interface pour les informations d'une banque
export interface BanqueInfo {
  id: number;
  nom: string;
  code: string;
  adresse: string;
  telephone: string;
  email: string;
  type: string;
  enabled: boolean;
}

// ✅ Interface pour les données SATIM enrichies
export interface SatimDataDTO {
  strCode: number;
  strRecoCode: string;
  strRecoNumb: number;
  strProcDate?: string;
  strOperCode?: string;
  strTermIden?: string;
  strIssuBanCode?: string;
  strAcquBanCode?: string;
  strAuthNumb?: string;
  strMercIden?: string;
  strMercLoca?: string;
  strPurcAmt?: number;
  strCardNumb?: string;
  transactionId?: number;
}