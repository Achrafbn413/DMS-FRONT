// Interfaces pour les détails complets d'une transaction
export interface TransactionDetailsResponse {
  id: number;
  reference: string;
  montant: number;
  dateTransaction: string;
  type: string;
  statut: string;
  banqueEmettrice?: BanqueInfo;
  banqueAcquereuse?: BanqueInfo;
  satimData?: SatimDataDTO;
  metaData?: MetaDataDTO;
  litige?: LitigeBasicInfo;
  dureeDepuisCreationJours?: number;
  priorite: string;
  aLitige: boolean;
}

export interface BanqueInfo {
  id: number;
  nom: string;
  code: string;
  type: string;
  enabled: boolean;
}

export interface SatimDataDTO {
  strCode: number;
  strRecoCode: string;
  strRecoNumb: number;
  strProcDate?: string;
  strOperCode?: string;
  strTermIden?: string;
  strIssuBanCode?: string;
  strAcquBanCode?: string;
}

export interface MetaDataDTO {
  id: number;
  strCode: number;
  strRecoCode: string;
  strRecoNumb: number;
  strOperCode?: string;
  strProcDate?: string;
  strTermIden?: string;
}

export interface LitigeBasicInfo {
  id: number;
  type: string;
  statut: string;
  description?: string;
  dateCreation: string;
  banqueDeclaranteNom: string;
  utilisateurCreateur: string;
}