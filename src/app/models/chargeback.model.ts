// ===============================================
// MODÈLES CHARGEBACK - CORRIGÉS pour compatibilité DTOs backend
// ===============================================

// ✅ Phases de chargeback (string libre comme dans backend)
export const PHASES_CHARGEBACK = {
  CHARGEBACK_INITIAL: 'CHARGEBACK_INITIAL',
  REPRESENTATION: 'REPRESENTATION', 
  PRE_ARBITRAGE: 'PRE_ARBITRAGE',
  ARBITRAGE: 'ARBITRAGE',
  FINALISE: 'FINALISE'
} as const;

export type PhaseChargeback = typeof PHASES_CHARGEBACK[keyof typeof PHASES_CHARGEBACK];

// ✅ Types de réponse représentation - Exactement comme dans RepresentationRequest
export enum TypeReponseRepresentation {
  ACCEPTATION_TOTALE = 'ACCEPTATION_TOTALE',
  ACCEPTATION_PARTIELLE = 'ACCEPTATION_PARTIELLE', 
  CONTESTATION_TOTALE = 'CONTESTATION_TOTALE'  // ✅ CORRIGÉ
}

// ✅ Décisions d'arbitrage (compatible avec ArbitrageDTO.Decision)
export enum DecisionArbitrage {
  FAVORABLE_EMETTEUR = 'FAVORABLE_EMETTEUR',
  FAVORABLE_ACQUEREUR = 'FAVORABLE_ACQUEREUR'
}

// ✅ Répartition des frais (compatible avec ArbitrageDTO.RepartitionFrais)
export enum RepartitionFrais {
  PERDANT = 'PERDANT',
  EMETTEUR = 'EMETTEUR', 
  ACQUEREUR = 'ACQUEREUR',
  PARTAGE = 'PARTAGE'
}

// ===============================================
// INTERFACES REQUÊTE (exactement comme les DTOs backend)
// ===============================================

// ✅ InitiationChargebackRequest - Exactement comme le DTO backend
export interface InitiationChargebackRequest {
  // Données transaction (automatiques)
  litigeId: number;
  transactionId?: number;
  banqueEmettriceId?: number;
  utilisateurEmetteurId?: number;
  employeId?: number;
  
  // Saisie employé (interface)
  motifChargeback: string;
  description?: string;
  
  // Upload justificatifs
  justificatifs?: string[];
  fichiersJustificatifs?: File[];
  typesJustificatifs?: string[];
  commentairesFichiers?: string[];
  
  // Paramètres chargeback
  montantConteste: number;
  priorite?: string;
  demandeUrgente?: boolean;
  
  // Informations client (optionnelles)
  clientId?: number;
  commentaireClient?: string;
  numeroReclamation?: string;
  canalReclamation?: string;
  
  // Notifications
  notifierClient?: boolean;
  notifierAutomatiquement?: boolean;
  referenceInterne?: string;
}

// ✅ RepresentationRequest - Exactement comme le DTO backend
export interface RepresentationRequest {
  // Identification
  litigeId: number;
  banqueAcquereuseId?: number;
  utilisateurAcquereurId?: number;
  employeId?: number;
  
  // Décision de réponse
  typeReponse: string; // ✅ CORRIGÉ: string au lieu d'enum
  accepteChargeback?: boolean;
  
  // Montants
  montantAccepte?: number;
  justificationMontant?: string;
  
  // Réponse détaillée
  reponseDetaillee: string; // ✅ AJOUTÉ: propriété manquante
  argumentsDefense?: string;
  argumentsJuridiques?: string;
  
  // Upload preuves
  justificatifsDefense?: string[];
  fichiersPreuves?: File[];
  typesPreuves?: string[];
  commentairesPreuves?: string[];
  
  // Informations commerçant
  commercantId?: number;
  nomCommercant?: string;
  declarationCommercant?: string;
  commercantAccepteRemboursement?: boolean;
  
  // Paramètres de traitement
  demandeDelaiSupplementaire?: boolean;
  joursDelaiSupplementaire?: number;
  motifDelaiSupplementaire?: string;
  
  // Escalade et suivi
  recommandeEscalade?: boolean;
  justificationEscalade?: string;
  niveauConfiance?: string;
  
  // Notifications
  notifierCommercant?: boolean;
  notifierBanqueEmettrice?: boolean;
  referenceInterne?: string;
}

// ✅ SecondPresentmentRequest - Exactement comme le DTO backend
export interface SecondPresentmentRequest {
  // Identification
  litigeId: number;
  banqueEmettriceId?: number;
  utilisateurEmetteurId?: number;
  employeId?: number;
  
  // Rejet de la représentation
  motifRejet: string; // ✅ AJOUTÉ: propriété manquante
  refutationDetaillee: string; // ✅ AJOUTÉ: propriété manquante
  refutationPointParPoint?: string;
  
  // Nouveaux arguments et preuves
  argumentsSupplementaires?: string;
  nouvellesPreuves?: File[];
  nouvellesSpreuves?: string[]; // ✅ AJOUTÉ: avec orthographe du backend
  typesNouvellesPreuves?: string[];
  commentairesNouvellesPreuves?: string[];
  
  // Analyse technique
  analyseTechnique?: string;
  indicateursFraude?: string[];
  scoreRisqueFraude?: number;
  
  // Montant et impact
  montantFinalConteste?: number;
  justificationMontant?: string;
  impactClient?: string;
  
  // Stratégie et escalade
  demandeArbitrage?: boolean;
  prioriteEscalade?: string;
  strategieArbitrage?: string;
  coutArbitrageEstime?: number;
  
  // Négociation et alternatives
  propositionNegociation?: boolean;
  montantNegociation?: number;
  termesNegociation?: string;
  delaiReponseNegociation?: number;
  
  // Contexte et historique
  contexteClient?: string;
  historiqueSimilaire?: boolean;
  referenceHistorique?: string;
  
  // Notifications
  notifierClient?: boolean;
  notifierHierarchie?: boolean;
  niveauEscalade?: string;
  referenceInterne?: string;
}

// ✅ InitiationArbitrageRequest - Exactement comme le DTO backend
export interface InitiationArbitrageRequest {
  // Identification
  litigeId: number;
  banqueDemandeuse?: number; // ✅ AJOUTÉ: propriété manquante
  utilisateurDemandeurId?: number;
  employeId?: number;
  
  // Justification arbitrage
  justificationDemande: string;
  justificationArbitrage?: string;
  resumeDifferend?: string;
  
  // Arguments et position
  positionBanque: string; // ✅ AJOUTÉ: propriété manquante
  argumentsCles?: string[];
  argumentsJuridiques?: string;
  
  // Dossier complet
  documentsFinaux?: File[];
  typesDocuments?: string[];
  commentairesDocuments?: string[];
  
  // Coûts et priorité
  coutEstime?: number;
  priorite?: string;
  demandeUrgente?: boolean;
  justificationUrgence?: string;
  
  // Délais et planning
  delaiSouhaite?: number;
  contraintesDelai?: string;
  
  // Type et complexité
  typeArbitrage?: string;
  niveauComplexite?: string;
  expertiseRequise?: string[];
  
  // Préférences arbitrage
  arbitrePreferentiel?: string;
  modeArbitrage?: string;
  audienceRequise?: boolean;
  justificationAudience?: string;
  
  // Impact et conséquences
  impactBusiness?: string;
  precedentImportant?: boolean;
  justificationPrecedent?: string;
  impactClient?: string;
  
  // Notifications
  notifierHierarchie?: boolean;
  niveauNotification?: string;
  copieInteressees?: string[];
  referenceInterne?: string;
}

// ===============================================
// INTERFACES RÉPONSE (exactement comme les DTOs backend)  
// ===============================================

// ✅ ArbitrageDTO - Exactement comme le DTO backend
export interface ArbitrageDTO {
  id?: number;
  litigeId: number;
  demandeParInstitutionId?: number;
  dateDemande?: string;
  dateDecision?: string;
  decision?: string;
  motifsDecision?: string;
  coutArbitrage?: number;
  repartitionFrais?: string;
  arbitreUtilisateurId?: number;
  statut?: string;
  
  // Champs calculés
  statutLibelle?: string;
  decisionLibelle?: string;
  repartitionFraisLibelle?: string;
  dureeArbitrageJours?: number;
  dureeArbitrageHeures?: number;
  dateDemandeFormatee?: string;
  dateDecisionFormatee?: string;
  payeurFrais?: string;
  repartitionMontants?: string;
  resume?: string;
  enRetard?: boolean;
  priorite?: string;
  complexite?: string;
  slaJours?: number;
  respecteSLA?: boolean;
  pourcentageSLA?: number;
  couleurStatut?: string;
  iconeStatut?: string;
  actionsDisponibles?: string[];
  alertes?: string[];
  
  // Informations enrichies
  demandeParInstitutionNom?: string;
  arbitreNom?: string;
  typeArbitrage?: string;
  niveauArbitrage?: number;
  peutFaireAppel?: boolean;
  dateLimiteAppel?: string;
}

// ✅ JustificatifChargeback - Compatible avec le backend
export interface JustificatifChargeback {
  id?: number;
  litigeId: number;
  nomFichier: string;
  typeJustificatif: string;
  phaseLitige: string;
  cheminFichier: string;
  tailleFichier?: number;
  formatFichier?: string;
  transmisParUtilisateurId?: number;
  dateAjout?: string;
  valide?: boolean;
  commentaires?: string;
  visiblePourAutrePartie?: boolean;
}

// ✅ EchangeLitige - Compatible avec le backend
export interface EchangeLitige {
  id?: number;
  litigeId: number;
  contenu: string;
  auteurUtilisateurId?: number;
  institutionId?: number;
  dateEchange?: string;
  phaseLitige?: string;
  typeEchange: string;
  pieceJointeJustificatifId?: number;
  visible?: boolean;
  luParAutrePartie?: boolean;
}

// ✅ DelaiLitige - Compatible avec le backend
export interface DelaiLitige {
  id?: number;
  litigeId: number;
  phaseLitige: string;
  dateDebut: string;
  dateLimite: string;
  prolongationAccordee?: number;
  motifProlongation?: string;
  statutDelai?: string;
  dateCreation?: string;
}

// ===============================================
// INTERFACE PRINCIPALE LitigeChargebackDTO (exactement comme le backend)
// ===============================================

export interface LitigeChargebackDTO {
  // ✅ Propriétés exactes du DTO backend
  id?: number;
  litigeId: number;
  phaseActuelle?: string;
  motifChargeback?: string;
  montantConteste?: number;
  peutEtreEscalade?: boolean;
  deadlineActuelle?: string;
  joursRestantsCalcule?: number;
  fraisArbitrageEstime?: number;
  versionWorkflow?: number;
  dateDerniereAction?: string;
  dateCreation?: string;
  dateModification?: string;
  
  // Collections (incluses selon le contexte)
  justificatifs?: JustificatifChargeback[];
  echanges?: EchangeLitige[];
  delais?: DelaiLitige[];
  arbitrages?: ArbitrageDTO[];
  
  // Champs calculés pour l'affichage
  statutWorkflow?: string;
  prochainePhasePossible?: string;
  deadlineDepassee?: boolean;
  nombreJustificatifsValides?: number;
  nombreEchangesNonLus?: number;
  enArbitrage?: boolean;
  
  // ✅ Données enrichies (ajoutées par le backend si disponibles)
  litige?: {
    id: number;
    type: string;
    statut: string;
    description?: string;
    dateCreation: string;
    banqueDeclaranteNom?: string;
    utilisateurCreateur?: string;
  };
  
  transaction?: {
    id: number;
    reference: string;
    montant: number;
    type: string;
    statut: string;
    dateTransaction: string;
    banqueEmettrice?: {
      id: number;
      nom: string;
      type?: string;
    };
    banqueAcquereuse?: {
      id: number;
      nom: string;
      type?: string;
    };
  };
}

// ===============================================
// INTERFACES UTILITAIRES
// ===============================================

export interface StatistiquesChargeback {
  total: number;
  enCours: number;
  finalises: number;
  urgents: number;
  montantTotal: number;
}

export interface UploadJustificatifResponse {
  filename: string;
  path: string;
  success: boolean;
  message?: string;
}

export interface JustificatifMetadata {
  phase: string;
  type: string;
  litigeId: number;
}

export interface ChargebackFilters {
  phase?: string;
  urgent?: boolean;
  dateDebut?: string;
  dateFin?: string;
  texteRecherche?: string;
  institutionId?: number;
}

export interface ChargebackActions {
  canInitier: boolean;
  canRepresenter: boolean;
  canSecondPresentment: boolean;
  canDemanderArbitrage: boolean;
  canDeciderArbitrage: boolean;
  canAnnuler: boolean;
  isEmettrice: boolean;
  isAcquereuse: boolean;
  isAdmin: boolean;
}

// ===============================================
// INTERFACES COMPLÉMENTAIRES (de vos modèles existants)
// ===============================================

export interface Institution {
  id: number;
  nom: string;
  type?: string;
  enabled?: boolean;
}

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: string;
  enabled: boolean;
  institution?: Institution;
  niveaux?: string;
}

export interface TransactionWithChargeback {
  id: number;
  reference: string;
  montant: number;
  dateTransaction: string;
  type: string;
  statut: string;
  banqueEmettrice?: Institution;
  banqueAcquereuse?: Institution;
  
  // Données chargeback
  hasChargeback?: boolean;
  phaseChargeback?: string;
  montantConteste?: number;
  nombreChargebacks?: number;
  deadlineChargeback?: string;
  joursRestantsChargeback?: number;
  isUrgentChargeback?: boolean;
}
// ✅ AJOUTEZ cette interface après InitiationArbitrageRequest
export interface DecisionArbitrageRequest {
  // Identification
  litigeId: number;
  arbitrageId?: number;
  
  // Décision
  decision: string; // 'FAVORABLE_EMETTEUR' | 'FAVORABLE_ACQUEREUR'
  motifsDecision: string;
  
  // Frais
  repartitionFrais: string; // 'PERDANT' | 'EMETTEUR' | 'ACQUEREUR' | 'PARTAGE'
  coutArbitrage?: number;
  
  // Métadonnées
  dateDecision?: string;
  arbitreUtilisateurId?: number;
  
  // Informations complémentaires
  resumeDecision?: string;
  impactDecision?: string;
  justificationCout?: string;
  
  // Notifications
  notifierParties?: boolean;
  referenceInterne?: string;
}

// ✅ AJOUTEZ aussi cette interface pour les annulations
export interface AnnulationChargebackRequest {
  litigeId: number;
  motifAnnulation: string;
  impactClient?: string;
  justificationAnnulation?: string;
  remboursementClient?: boolean;
  montantRemboursement?: number;
  dateAnnulation?: string;
  notifierClient?: boolean;
  referenceInterne?: string;
}

// ===============================================
// UTILITAIRES POUR LE FRONTEND
// ===============================================

export class ChargebackUtils {
  
  static getPhaseLabel(phase: string): string {
    switch (phase) {
      case PHASES_CHARGEBACK.CHARGEBACK_INITIAL:
        return 'Chargeback Initial';
      case PHASES_CHARGEBACK.REPRESENTATION:
        return 'Représentation';
      case PHASES_CHARGEBACK.PRE_ARBITRAGE:
        return 'Pré-arbitrage';
      case PHASES_CHARGEBACK.ARBITRAGE:
        return 'Arbitrage';
      case PHASES_CHARGEBACK.FINALISE:
        return 'Finalisé';
      default:
        return phase;
    }
  }
  
  static getPhaseColor(phase: string): string {
    switch (phase) {
      case PHASES_CHARGEBACK.CHARGEBACK_INITIAL:
        return 'primary';
      case PHASES_CHARGEBACK.REPRESENTATION:
        return 'warning';
      case PHASES_CHARGEBACK.PRE_ARBITRAGE:
        return 'info';
      case PHASES_CHARGEBACK.ARBITRAGE:
        return 'danger';
      case PHASES_CHARGEBACK.FINALISE:
        return 'success';
      default:
        return 'secondary';
    }
  }
  
  static isPhaseUrgente(deadline: string, phase: string): boolean {
    if (phase === PHASES_CHARGEBACK.FINALISE) return false;
    
    if (!deadline) return false;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 1; // Urgent si moins de 2 jours
  }
  
  static calculerJoursRestants(deadline: string): number {
    if (!deadline) return 0;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
  
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}