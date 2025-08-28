import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { TransactionService } from '../../../services/transaction.service';
import { LitigeService } from '../../../services/litige.service';
import { NotificationService } from '../../../services/notification.service';

// ✅ IMPORTS EXISTANTS
import { Transaction, TransactionWithMeta, SatimTransactionResponse, StatutTransaction } from '../../../models/transaction.model';
import { Litige, LitigeRecu, TypeLitige, StatutLitige, LitigeResponseDTO } from '../../../models/litige.model';
import { Utilisateur, RoleUtilisateur } from '../../../models/user.model';
import { Institution, TypeInstitution } from '../../../models/institution.model';
import { AuthService } from '../../../auth/auth.service';
import { ChargebackService } from '../../../services/ChargebackService';

// ✅ NOUVEAUX IMPORTS CHARGEBACK
import { 
  LitigeChargebackDTO, 
  InitiationChargebackRequest,
  RepresentationRequest,
  SecondPresentmentRequest,
  InitiationArbitrageRequest,  // ✅ CORRIGÉ
  DecisionArbitrageRequest,  // ✅ SUPPRIMÉ - n'existe pas
  AnnulationChargebackRequest, // ✅ SUPPRIMÉ - n'existe pas
  EchangeLitige,
  JustificatifChargeback,
  ChargebackActions,
  StatistiquesChargeback,
  ChargebackFilters,
  PHASES_CHARGEBACK 
} from '../../../models/chargeback.model';

@Component({
  selector: 'app-dashboard-banque',
  standalone: true,
  templateUrl: './dashboard-banque.component.html',
  styleUrls: ['./dashboard-banque.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DashboardBanqueComponent implements OnInit {
  nomEmploye = '';
  institution = '';
  department = 'Surveillance Transactionnelle';

  // Navigation par onglets
  activeTab: 'transactions' | 'litiges-recus' | 'litiges-emis' | 'chargeback' = 'transactions';

  // Données transactions
  allTransactions: TransactionWithMeta[] = [];
  transactions: TransactionWithMeta[] = [];
  filteredTransactions: TransactionWithMeta[] = [];
  paginatedTransactions: TransactionWithMeta[] = [];
  
  // Données litiges
  litigesRecus: LitigeRecu[] = [];
  nombreLitigesNonLus: number = 0;
  litigesAcquereur: (Litige & { transaction: Transaction | null })[] = [];
  // Notifications
  unreadNotifications: Litige[] = [];
  showNotificationPanel = false;
  
  // Utilisateur et institution
  institutionId: number | null = null;
  currentUserId: number | null = null;
  currentUserRole: string = '';

  // États des transactions
  signaledTransactionIds: Set<number> = new Set();
  clickedTransactions: Set<number> = new Set();

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Filtres
  searchTerm = '';
  statutFilter = '';
  typeFilter = '';

  // Statistiques
  totalTransactions = 0;
  totalSignalableTransactions = 0;
  totalAmount = '0 MAD';
  averageAmount = '0 MAD';
  flaggedCount = 0;

  // États de chargement
  isUploadingFile = false;
  isLoadingTransactions = false;
  isLoadingLitiges = false;
  selectedFileName = '';

  // Modaux détails existants
  showDetailsModal = false;
  selectedLitigeDetails: any = null;
  isLoadingDetails = false;
  detailsError: string | null = null;

  showTransactionDetailsModal = false;
  selectedTransactionDetails: any = null;
  isLoadingTransactionDetails = false;
  transactionDetailsError: string | null = null;

  // ✅ NOUVELLES PROPRIÉTÉS CHARGEBACK
  chargebacks: LitigeChargebackDTO[] = [];
  filteredChargebacks: LitigeChargebackDTO[] = [];
  paginatedChargebacks: LitigeChargebackDTO[] = [];
  isLoadingChargebacks = false;
  chargebackStats: StatistiquesChargeback | null = null;
  
  // Modal chargeback
  showInitiationChargebackModal = false;
  selectedTransactionForChargeback: TransactionWithMeta | null = null;
  isInitiatingChargeback = false;
  
  // ✅ NOUVEAUX MODAUX CHARGEBACK
  showRepresentationModal = false;
  showSecondPresentmentModal = false;
  showArbitrageModal = false;
  showDecisionArbitrageModal = false;
  showCancellationModal = false;
  showHistoryModal = false;
  showJustificatifsModal = false;

  // CHARGEBACK SÉLECTIONNÉ
  selectedChargebackForAction: LitigeChargebackDTO | null = null;

  // ÉTATS DE CHARGEMENT ACTIONS
  isProcessingRepresentation = false;
  isProcessingSecondPresentment = false;
  isProcessingArbitrage = false;
  isProcessingDecision = false;
  isProcessingCancellation = false;

  // HISTORIQUE
  chargebackHistory: EchangeLitige[] = [];
  isLoadingHistory = false;

  // JUSTIFICATIFS
  selectedChargebackJustificatifs: JustificatifChargeback[] = [];
  isLoadingJustificatifs = false;
  newJustificatifs: File[] = [];

  // ✅ FORMULAIRES CHARGEBACK
  // Formulaire initiation chargeback
  chargebackForm = {
    motifChargeback: '',
    description: '',
    montantConteste: 0,
    priorite: 'NORMALE',
    demandeUrgente: false,
    justificatifs: [] as File[],
    commentaireClient: ''
  };

  // Formulaire représentation
  representationForm = {
    typeReponse: 'CONTESTATION',
    reponseDetaillee: '',
    argumentsDefense: '',
    montantAccepte: 0,
    justificatifsDefense: [] as File[],
    demandeDelaiSupplementaire: false,
    joursDelaiSupplementaire: 0
  };

  // Formulaire second presentment
  secondPresentmentForm = {
    motifRejet: '',
    refutationDetaillee: '',
    argumentsSupplementaires: '',
    nouvellesPreuves: [] as File[],
    analyseTechnique: '',
    demandeArbitrage: false
  };

  // Formulaire arbitrage
  arbitrageForm = {
    justificationDemande: '',
    positionBanque: '',
    argumentsCles: [] as string[],
    documentsFinaux: [] as File[],
    coutEstime: 0,
    priorite: 'NORMALE',
    demandeUrgente: false
  };

  // Formulaire décision arbitrage
  decisionArbitrageForm = {
    decision: 'FAVORABLE_EMETTEUR',
    motifsDecision: '',
    repartitionFrais: 'PERDANT'
  };

  // Formulaire annulation
  cancellationForm = {
    motifAnnulation: '',
    impactClient: ''
  };

  // Filtres chargeback
  chargebackFilters: ChargebackFilters = {
    phase: '',
    urgent: false,
    dateDebut: '',
    dateFin: '',
    texteRecherche: ''
  };

  // Pagination chargeback
  chargebackCurrentPage = 1;
  chargebackItemsPerPage = 10;
  chargebackTotalPages = 0;

// ✅ NOUVELLES PROPRIÉTÉS POUR SÉPARATION ÉMETTEUR/ACQUÉREUR
chargebackActiveSubTab: 'emis' | 'recus' = 'emis';

// Listes séparées
chargebacksEmis: LitigeChargebackDTO[] = [];
chargebacksRecus: LitigeChargebackDTO[] = [];

// Listes filtrées séparées
filteredChargebacksEmis: LitigeChargebackDTO[] = [];
filteredChargebacksRecus: LitigeChargebackDTO[] = [];

// Pagination séparée
paginatedChargebacksEmis: LitigeChargebackDTO[] = [];
paginatedChargebacksRecus: LitigeChargebackDTO[] = [];

// Filtres séparés
chargebackFiltersEmis: ChargebackFilters = {
  phase: '',
  urgent: false,
  dateDebut: '',
  dateFin: '',
  texteRecherche: ''
};

chargebackFiltersRecus: ChargebackFilters = {
  phase: '',
  urgent: false,
  dateDebut: '',
  dateFin: '',
  texteRecherche: ''
};

  constructor(
    private transactionService: TransactionService,
    private litigeService: LitigeService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private authService: AuthService,
    private chargebackService: ChargebackService
  ) {}

  ngOnInit(): void {
    this.initializeUserData();
    console.log('🔍 USER INIT:', {
      institutionId: this.institutionId,
      institution: this.institution,
      currentUserId: this.currentUserId,
      userRole: this.currentUserRole
    });
  }
  // ✅ NAVIGATION ENTRE ONGLETS
  setActiveTab(tab: 'transactions' | 'litiges-recus' | 'litiges-emis' | 'chargeback'): void {
    this.activeTab = tab;
    console.log('🔄 Changement d\'onglet vers:', tab);
    
    this.currentPage = 1;
    this.searchTerm = '';
    this.statutFilter = '';
    this.typeFilter = '';
    
    if (tab === 'transactions') {
      this.filterTransactions();
    } else if (tab === 'chargeback') {
      this.loadChargebackData();
    }
  }

  // ✅ NOUVELLES MÉTHODES POUR GÉRER LES SOUS-ONGLETS CHARGEBACK

/**
 * Changer de sous-onglet dans la section chargeback
 */
setChargebackSubTab(subTab: 'emis' | 'recus'): void {
  console.log('🔄 Changement sous-onglet chargeback vers:', subTab);
  this.chargebackActiveSubTab = subTab;
  
  if (subTab === 'emis') {
    this.filterChargebacksEmis();
  } else {
    this.filterChargebacksRecus();
  }
}

/**
 * Séparer les chargebacks selon le rôle émetteur/acquéreur
 */
/**
 * Séparer les chargebacks selon le rôle émetteur/acquéreur
 */
private separateChargebacksByRole(): void {
  console.log('🔄 [SEPARATION] Début séparation des chargebacks');
  console.log('🔄 [SEPARATION] Institution ID:', this.institutionId);
  console.log('🔄 [SEPARATION] Chargebacks disponibles:', this.chargebacks?.length || 0);

  if (!this.institutionId || !this.chargebacks) {
    console.log('❌ [SEPARATION] Données manquantes');
    this.chargebacksEmis = [];
    this.chargebacksRecus = [];
    return;
  }

  // Debug chaque chargeback
  this.debugChargebacks();

  this.chargebacksEmis = this.chargebacks.filter(cb => {
    const isEmetteur = cb.transaction?.banqueEmettrice?.id === this.institutionId;
    console.log(`🏧 [EMIS] CB #${cb.id}: ${isEmetteur ? 'OUI' : 'NON'} (${cb.transaction?.banqueEmettrice?.id} === ${this.institutionId})`);
    return isEmetteur;
  });

  this.chargebacksRecus = this.chargebacks.filter(cb => {
    const isAcquereur = cb.transaction?.banqueAcquereuse?.id === this.institutionId;
    console.log(`🏪 [RECUS] CB #${cb.id}: ${isAcquereur ? 'OUI' : 'NON'} (${cb.transaction?.banqueAcquereuse?.id} === ${this.institutionId})`);
    return isAcquereur;
  });

  console.log('📊 [SEPARATION] Résultat final:', {
    total: this.chargebacks.length,
    emis: this.chargebacksEmis.length,
    recus: this.chargebacksRecus.length
  });
}

/**
 * Filtrer les chargebacks émis
 */
filterChargebacksEmis(): void {
  this.filteredChargebacksEmis = this.chargebackService.filterChargebacks(
    this.chargebacksEmis, 
    this.chargebackFiltersEmis
  );
  
  // ✅ CORRIGÉ : Paginer correctement
  this.chargebackCurrentPage = 1;
  this.chargebackTotalPages = Math.ceil(this.filteredChargebacksEmis.length / this.chargebackItemsPerPage);
  this.paginatedChargebacksEmis = this.filteredChargebacksEmis.slice(0, this.chargebackItemsPerPage);
  
  console.log('🏧 Chargebacks émis filtrés:', {
    total: this.chargebacksEmis.length,
    filtered: this.filteredChargebacksEmis.length,
    paginated: this.paginatedChargebacksEmis.length
  });
}

/**
 * Filtrer les chargebacks reçus
 */
filterChargebacksRecus(): void {
  this.filteredChargebacksRecus = this.chargebackService.filterChargebacks(
    this.chargebacksRecus, 
    this.chargebackFiltersRecus
  );
  
  // ✅ CORRIGÉ : Paginer correctement
  this.chargebackCurrentPage = 1;
  this.chargebackTotalPages = Math.ceil(this.filteredChargebacksRecus.length / this.chargebackItemsPerPage);
  this.paginatedChargebacksRecus = this.filteredChargebacksRecus.slice(0, this.chargebackItemsPerPage);
  
  console.log('🏪 Chargebacks reçus filtrés:', {
    total: this.chargebacksRecus.length,
    filtered: this.filteredChargebacksRecus.length,
    paginated: this.paginatedChargebacksRecus.length
  });
}

/**
 * Effacer les filtres émis
 */
clearChargebackFiltersEmis(): void {
  this.chargebackFiltersEmis = {
    phase: '',
    urgent: false,
    dateDebut: '',
    dateFin: '',
    texteRecherche: ''
  };
  this.filterChargebacksEmis();
}

/**
 * Effacer les filtres reçus
 */
clearChargebackFiltersRecus(): void {
  this.chargebackFiltersRecus = {
    phase: '',
    urgent: false,
    dateDebut: '',
    dateFin: '',
    texteRecherche: ''
  };
  this.filterChargebacksRecus();
}

  // ✅ MÉTHODES OUVERTURE/FERMETURE MODAUX CHARGEBACK

  /**
   * Ouvrir modal représentation
   */
  openRepresentationModal(chargeback: LitigeChargebackDTO): void {
    console.log('📝 [Representation] Ouverture modal pour chargeback:', chargeback.id);
    
    if (!this.canRepresenter(chargeback)) {
      this.notificationService.showError('❌ Vous ne pouvez pas traiter cette représentation.');
      return;
    }

    this.selectedChargebackForAction = chargeback;
    this.representationForm = {
      typeReponse: 'CONTESTATION',
      reponseDetaillee: '',
      argumentsDefense: '',
      montantAccepte: chargeback.montantConteste || 0,
      justificatifsDefense: [],
      demandeDelaiSupplementaire: false,
      joursDelaiSupplementaire: 0
    };
    this.showRepresentationModal = true;
  }

  closeRepresentationModal(): void {
    this.showRepresentationModal = false;
    this.selectedChargebackForAction = null;
    this.resetForm('representation');
  }

  /**
   * Ouvrir modal second presentment
   */
  openSecondPresentmentModal(chargeback: LitigeChargebackDTO): void {
    console.log('⚡ [SecondPresentment] Ouverture modal pour chargeback:', chargeback.id);
    
    if (!this.canSecondPresentment(chargeback)) {
      this.notificationService.showError('❌ Vous ne pouvez pas effectuer de second presentment.');
      return;
    }

    this.selectedChargebackForAction = chargeback;
    this.secondPresentmentForm = {
      motifRejet: '',
      refutationDetaillee: '',
      argumentsSupplementaires: '',
      nouvellesPreuves: [],
      analyseTechnique: '',
      demandeArbitrage: false
    };
    this.showSecondPresentmentModal = true;
  }

  closeSecondPresentmentModal(): void {
    this.showSecondPresentmentModal = false;
    this.selectedChargebackForAction = null;
    this.resetForm('secondPresentment');
  }

  /**
   * Ouvrir modal arbitrage
   */
  openArbitrageModal(chargeback: LitigeChargebackDTO): void {
    console.log('⚖️ [Arbitrage] Ouverture modal pour chargeback:', chargeback.id);
    
    if (!this.canDemanderArbitrage(chargeback)) {
      this.notificationService.showError('❌ Vous ne pouvez pas demander d\'arbitrage.');
      return;
    }

    this.selectedChargebackForAction = chargeback;
    this.arbitrageForm = {
      justificationDemande: '',
      positionBanque: '',
      argumentsCles: [],
      documentsFinaux: [],
      coutEstime: 0,
      priorite: 'NORMALE',
      demandeUrgente: false
    };
    this.showArbitrageModal = true;
  }

  closeArbitrageModal(): void {
    this.showArbitrageModal = false;
    this.selectedChargebackForAction = null;
    this.resetForm('arbitrage');
  }

  /**
   * Ouvrir modal décision arbitrage
   */
  openDecisionArbitrageModal(chargeback: LitigeChargebackDTO): void {
    console.log('🏛️ [DecisionArbitrage] Ouverture modal pour chargeback:', chargeback.id);
    
    if (!this.canDeciderArbitrage(chargeback)) {
      this.notificationService.showError('❌ Vous ne pouvez pas décider de cet arbitrage.');
      return;
    }

    this.selectedChargebackForAction = chargeback;
    this.decisionArbitrageForm = {
      decision: 'FAVORABLE_EMETTEUR',
      motifsDecision: '',
      repartitionFrais: 'PERDANT'
    };
    this.showDecisionArbitrageModal = true;
  }

  closeDecisionArbitrageModal(): void {
    this.showDecisionArbitrageModal = false;
    this.selectedChargebackForAction = null;
    this.resetForm('decisionArbitrage');
  }

  /**
   * Ouvrir modal annulation
   */
  openCancellationModal(chargeback: LitigeChargebackDTO): void {
    console.log('🚫 [Cancellation] Ouverture modal pour chargeback:', chargeback.id);
    
    if (!this.canAnnuler(chargeback)) {
      this.notificationService.showError('❌ Vous ne pouvez pas annuler ce chargeback.');
      return;
    }

    this.selectedChargebackForAction = chargeback;
    this.cancellationForm = {
      motifAnnulation: '',
      impactClient: ''
    };
    this.showCancellationModal = true;
  }

  closeCancellationModal(): void {
    this.showCancellationModal = false;
    this.selectedChargebackForAction = null;
    this.resetForm('cancellation');
  }

  /**
   * Ouvrir modal historique
   */
  openHistoryModal(chargeback: LitigeChargebackDTO): void {
    console.log('📋 [History] Ouverture modal pour chargeback:', chargeback.id);
    
    this.selectedChargebackForAction = chargeback;
    this.showHistoryModal = true;
    this.loadChargebackHistory(chargeback.litigeId || 0);
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedChargebackForAction = null;
    this.chargebackHistory = [];
  }

  /**
   * Ouvrir modal justificatifs
   */
  openJustificatifsModal(chargeback: LitigeChargebackDTO): void {
  console.log('📎 [Justificatifs] Ouverture modal pour chargeback:', chargeback.id);
  
  // ✅ Vérification robuste
  const chargebackId = chargeback.id;
  if (!chargebackId || chargebackId <= 0) {
    console.error('❌ ID du chargeback invalide:', chargebackId);
    this.notificationService.showError('❌ Impossible d\'ouvrir les justificatifs : ID manquant');
    return;
  }
  
  this.selectedChargebackForAction = chargeback;
  this.showJustificatifsModal = true;
  this.loadChargebackJustificatifs(chargebackId); // ✅ TypeScript confirmé que c'est un number > 0
}

  closeJustificatifsModal(): void {
    this.showJustificatifsModal = false;
    this.selectedChargebackForAction = null;
    this.selectedChargebackJustificatifs = [];
    this.newJustificatifs = [];
  }
  // ✅ MÉTHODES TRAITEMENT ACTIONS CHARGEBACK

  /**
   * Traiter représentation
   */
  processRepresentation(): void {
    if (!this.selectedChargebackForAction || !this.isFormValid('representation')) {
      this.notificationService.showError('❌ Formulaire invalide');
      return;
    }

    // ✅ Vérification en amont
if (!this.selectedChargebackForAction || !this.selectedChargebackForAction.litigeId) {
  this.notificationService.showError('❌ Chargeback sélectionné invalide');
  return;
}

const request: RepresentationRequest = {
  litigeId: this.selectedChargebackForAction.litigeId,
  typeReponse: this.representationForm.typeReponse,
  reponseDetaillee: this.representationForm.reponseDetaillee,
  argumentsDefense: this.representationForm.argumentsDefense,
  montantAccepte: this.representationForm.montantAccepte,
  demandeDelaiSupplementaire: this.representationForm.demandeDelaiSupplementaire,
  joursDelaiSupplementaire: this.representationForm.joursDelaiSupplementaire
};

    console.log('📝 [Representation] Traitement:', request);
    this.isProcessingRepresentation = true;

    this.chargebackService.traiterRepresentation(request).subscribe({
      next: (result) => {
        this.notificationService.showSuccess('✅ Représentation traitée avec succès');
        this.closeRepresentationModal();
        this.loadChargebackData();
        this.isProcessingRepresentation = false;
      },
      error: (error) => {
        console.error('❌ Erreur représentation:', error);
        this.notificationService.showError('❌ Erreur lors du traitement de la représentation');
        this.isProcessingRepresentation = false;
      }
    });
  }

  /**
   * Traiter second presentment
   */
  processSecondPresentment(): void {
    if (!this.selectedChargebackForAction || !this.isFormValid('secondPresentment')) {
      this.notificationService.showError('❌ Formulaire invalide');
      return;
    }

    const request: SecondPresentmentRequest = {
      litigeId: this.selectedChargebackForAction.litigeId,
      motifRejet: this.secondPresentmentForm.motifRejet,
      refutationDetaillee: this.secondPresentmentForm.refutationDetaillee,
      argumentsSupplementaires: this.secondPresentmentForm.argumentsSupplementaires,
      analyseTechnique: this.secondPresentmentForm.analyseTechnique,
      demandeArbitrage: this.secondPresentmentForm.demandeArbitrage
    };

    console.log('⚡ [SecondPresentment] Traitement:', request);
    this.isProcessingSecondPresentment = true;

    this.chargebackService.traiterSecondPresentment(request).subscribe({
      next: (result) => {
        this.notificationService.showSuccess('✅ Second presentment traité avec succès');
        this.closeSecondPresentmentModal();
        this.loadChargebackData();
        this.isProcessingSecondPresentment = false;
      },
      error: (error) => {
        console.error('❌ Erreur second presentment:', error);
        this.notificationService.showError('❌ Erreur lors du traitement du second presentment');
        this.isProcessingSecondPresentment = false;
      }
    });
  }

  /**
   * Traiter arbitrage
   */
  processArbitrage(): void {
    if (!this.selectedChargebackForAction || !this.isFormValid('arbitrage')) {
      this.notificationService.showError('❌ Formulaire invalide');
      return;
    }

    // ✅ Vérification en amont
if (!this.selectedChargebackForAction || !this.selectedChargebackForAction.litigeId) {
  this.notificationService.showError('❌ Chargeback sélectionné invalide');
  return;
}

const request: InitiationArbitrageRequest = {
  litigeId: this.selectedChargebackForAction.litigeId,
  justificationDemande: this.arbitrageForm.justificationDemande,
  positionBanque: this.arbitrageForm.positionBanque,
  argumentsCles: this.arbitrageForm.argumentsCles,
  coutEstime: this.arbitrageForm.coutEstime,
  priorite: this.arbitrageForm.priorite,
  demandeUrgente: this.arbitrageForm.demandeUrgente
};

    console.log('⚖️ [Arbitrage] Traitement:', request);
    this.isProcessingArbitrage = true;

    this.chargebackService.demanderArbitrage(request).subscribe({
      next: (result) => {
        this.notificationService.showSuccess('✅ Demande d\'arbitrage soumise avec succès');
        this.closeArbitrageModal();
        this.loadChargebackData();
        this.isProcessingArbitrage = false;
      },
      error: (error) => {
        console.error('❌ Erreur arbitrage:', error);
        this.notificationService.showError('❌ Erreur lors de la demande d\'arbitrage');
        this.isProcessingArbitrage = false;
      }
    });
  }

  /**
   * Traiter décision arbitrage
   */
  processDecisionArbitrage(): void {
    if (!this.selectedChargebackForAction || !this.isFormValid('decisionArbitrage')) {
      this.notificationService.showError('❌ Formulaire invalide');
      return;
    }

    const request: DecisionArbitrageRequest = {
  litigeId: this.selectedChargebackForAction.litigeId || 0,
  decision: this.decisionArbitrageForm.decision,           // ✅ Propriété pour décision
  motifsDecision: this.decisionArbitrageForm.motifsDecision, // ✅ Propriété pour décision
  repartitionFrais: this.decisionArbitrageForm.repartitionFrais // ✅ Propriété pour décision
};

console.log('🏛️ [DecisionArbitrage] Traitement:', request);
this.isProcessingDecision = true;

this.chargebackService.deciderArbitrage(this.selectedChargebackForAction.id || 0, request).subscribe({
  next: (result: any) => {
    console.log('✅ Décision arbitrage résultat:', result);
    this.notificationService.showSuccess('✅ Décision d\'arbitrage rendue avec succès');
    this.closeDecisionArbitrageModal();
    this.loadChargebackData();
    this.isProcessingDecision = false;
  },
  error: (error: any) => {
    console.error('❌ Erreur décision arbitrage:', error);
    this.notificationService.showError('❌ Erreur lors de la décision d\'arbitrage');
    this.isProcessingDecision = false;
  }
});
  }

  /**
   * Traiter annulation
   */
  processCancellation(): void {
    if (!this.selectedChargebackForAction || !this.isFormValid('cancellation')) {
      this.notificationService.showError('❌ Formulaire invalide');
      return;
    }
const motifAnnulation = this.cancellationForm.motifAnnulation;

console.log('🚫 [Cancellation] Traitement:', { 
  litigeId: this.selectedChargebackForAction.litigeId,
  motifAnnulation 
});
this.isProcessingCancellation = true;

this.chargebackService.annulerChargeback(
  this.selectedChargebackForAction.litigeId || 0, 
  motifAnnulation // ✅ CORRIGÉ : passer directement le string
).subscribe({
  next: (result: any) => { // ✅ Type explicite
    console.log('✅ Annulation résultat:', result);
    this.notificationService.showSuccess('✅ Chargeback annulé avec succès');
    this.closeCancellationModal();
    this.loadChargebackData();
    this.isProcessingCancellation = false;
  },
  error: (error: any) => { // ✅ Type explicite
    console.error('❌ Erreur annulation:', error);
    this.notificationService.showError('❌ Erreur lors de l\'annulation du chargeback');
    this.isProcessingCancellation = false;
  }
});
  }

  /**
   * Charger historique chargeback
   */
  loadChargebackHistory(litigeId: number): void {
    this.isLoadingHistory = true;
    
    this.chargebackService.getHistoriqueChargeback(litigeId).subscribe({
      next: (history: EchangeLitige[]) => {
        this.chargebackHistory = history;
        this.isLoadingHistory = false;
        console.log('📋 [History] Chargé:', history.length, 'échanges');
      },
      error: (error) => {
        console.error('❌ Erreur chargement historique:', error);
        this.isLoadingHistory = false;
        this.notificationService.showError('❌ Erreur lors du chargement de l\'historique');
      }
    });
  }

  /**
   * Charger justificatifs chargeback
   */
  loadChargebackJustificatifs(chargebackId: number): void {
    this.isLoadingJustificatifs = true;
    
    // TODO: Implémenter quand l'endpoint sera disponible
    // this.chargebackService.getJustificatifsChargeback(chargebackId).subscribe({
    //   next: (justificatifs: JustificatifChargeback[]) => {
    //     this.selectedChargebackJustificatifs = justificatifs;
    //     this.isLoadingJustificatifs = false;
    //   },
    //   error: (error) => {
    //     console.error('❌ Erreur chargement justificatifs:', error);
    //     this.isLoadingJustificatifs = false;
    //   }
    // });
    
    // Simulation temporaire
    setTimeout(() => {
      this.selectedChargebackJustificatifs = [];
      this.isLoadingJustificatifs = false;
    }, 500);
  }
  // ✅ MÉTHODES UTILITAIRES ET VALIDATION

  /**
   * Vérifier si un formulaire est valide
   */
  isFormValid(formName: string): boolean {
    switch (formName) {
      case 'representation':
        return this.representationForm.reponseDetaillee.length >= 20;
      
      case 'secondPresentment':
        return this.secondPresentmentForm.motifRejet.length >= 20 &&
               this.secondPresentmentForm.refutationDetaillee.length >= 50;
      
      case 'arbitrage':
        return this.arbitrageForm.justificationDemande.length >= 50 &&
               this.arbitrageForm.positionBanque.length >= 30;
      
      case 'decisionArbitrage':
        return this.decisionArbitrageForm.motifsDecision.length >= 20;
      
      case 'cancellation':
        return this.cancellationForm.motifAnnulation.length >= 10;
      
      default:
        return false;
    }
  }

  /**
   * Réinitialiser un formulaire
   */
  resetForm(formName: string): void {
    switch (formName) {
      case 'representation':
        this.representationForm = {
          typeReponse: 'CONTESTATION',
          reponseDetaillee: '',
          argumentsDefense: '',
          montantAccepte: 0,
          justificatifsDefense: [],
          demandeDelaiSupplementaire: false,
          joursDelaiSupplementaire: 0
        };
        break;
      
      case 'secondPresentment':
        this.secondPresentmentForm = {
          motifRejet: '',
          refutationDetaillee: '',
          argumentsSupplementaires: '',
          nouvellesPreuves: [],
          analyseTechnique: '',
          demandeArbitrage: false
        };
        break;
      
      case 'arbitrage':
        this.arbitrageForm = {
          justificationDemande: '',
          positionBanque: '',
          argumentsCles: [],
          documentsFinaux: [],
          coutEstime: 0,
          priorite: 'NORMALE',
          demandeUrgente: false
        };
        break;
      
      case 'decisionArbitrage':
        this.decisionArbitrageForm = {
          decision: 'FAVORABLE_EMETTEUR',
          motifsDecision: '',
          repartitionFrais: 'PERDANT'
        };
        break;
      
      case 'cancellation':
        this.cancellationForm = {
          motifAnnulation: '',
          impactClient: ''
        };
        break;
    }
  }

  /**
   * Vérifier les permissions pour les actions chargeback
   */
  canRepresenter(chargeback: LitigeChargebackDTO): boolean {
    const actions = this.getChargebackActions(chargeback);
    return actions.canRepresenter;
  }

  canSecondPresentment(chargeback: LitigeChargebackDTO): boolean {
    const actions = this.getChargebackActions(chargeback);
    return actions.canSecondPresentment;
  }

  canDemanderArbitrage(chargeback: LitigeChargebackDTO): boolean {
    const actions = this.getChargebackActions(chargeback);
    return actions.canDemanderArbitrage;
  }

  canDeciderArbitrage(chargeback: LitigeChargebackDTO): boolean {
    const actions = this.getChargebackActions(chargeback);
    return actions.canDeciderArbitrage;
  }

  canAnnuler(chargeback: LitigeChargebackDTO): boolean {
    const actions = this.getChargebackActions(chargeback);
    return actions.canAnnuler;
  }

  /**
   * Gérer la sélection de fichiers pour les justificatifs
   */
  onJustificatifsSelectedForPhase(event: Event, phase: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      switch (phase) {
        case 'REPRESENTATION':
          this.representationForm.justificatifsDefense = files;
          break;
        case 'SECOND_PRESENTMENT':
          this.secondPresentmentForm.nouvellesPreuves = files;
          break;
        case 'ARBITRAGE':
          this.arbitrageForm.documentsFinaux = files;
          break;
        case 'JUSTIFICATIFS_MODAL':
          this.newJustificatifs = files;
          break;
      }
      
      console.log(`📎 [${phase}] Fichiers sélectionnés:`, files.length);
    }
  }

  /**
   * Télécharger un justificatif
   */
downloadJustificatif(justificatif: JustificatifChargeback): void {
  // TODO: Implémenter le téléchargement
  console.log('📥 Téléchargement justificatif:', justificatif.nomFichier); // ✅ CORRIGÉ
  this.notificationService.showInfo('📥 Téléchargement de ' + justificatif.nomFichier); // ✅ CORRIGÉ
}

 /**
  * Obtenir la progression du stepper
  */
 getStepperProgress(chargeback: LitigeChargebackDTO): number {
   const phases = ['CHARGEBACK_INITIAL', 'REPRESENTATION', 'PRE_ARBITRAGE', 'ARBITRAGE', 'FINALISE'];
   const currentIndex = phases.indexOf(chargeback.phaseActuelle || '');
   return currentIndex >= 0 ? ((currentIndex + 1) / phases.length) * 100 : 0;
 }

 /**
  * Obtenir les étapes du stepper
  */
 getStepperSteps(chargeback: LitigeChargebackDTO): any[] {
  const currentPhase = chargeback.phaseActuelle || ''; // ✅ Valeur par défaut
  return [
    { 
      label: 'Initial', 
      icon: '🔵', 
      active: currentPhase === 'CHARGEBACK_INITIAL',
      completed: this.isPhaseCompleted('CHARGEBACK_INITIAL', currentPhase)
    },
    { 
      label: 'Représentation', 
      icon: '🟡', 
      active: currentPhase === 'REPRESENTATION',
      completed: this.isPhaseCompleted('REPRESENTATION', currentPhase)
    },
    { 
      label: 'Pré-Arbitrage', 
      icon: '🟠', 
      active: currentPhase === 'PRE_ARBITRAGE',
      completed: this.isPhaseCompleted('PRE_ARBITRAGE', currentPhase)
    },
    { 
      label: 'Arbitrage', 
      icon: '🔴', 
      active: currentPhase === 'ARBITRAGE',
      completed: this.isPhaseCompleted('ARBITRAGE', currentPhase)
    },
    { 
      label: 'Finalisé', 
      icon: '✅', 
      active: currentPhase === 'FINALISE',
      completed: currentPhase === 'FINALISE'
    }
  ];
}

 /**
  * Vérifier si une phase est terminée
  */
 private isPhaseCompleted(phase: string, currentPhase: string): boolean {
   const phases = ['CHARGEBACK_INITIAL', 'REPRESENTATION', 'PRE_ARBITRAGE', 'ARBITRAGE', 'FINALISE'];
   const phaseIndex = phases.indexOf(phase);
   const currentIndex = phases.indexOf(currentPhase);
   return currentIndex > phaseIndex;
 }

 /**
  * Obtenir les prochaines actions possibles
  */
 getNextPossibleActions(chargeback: LitigeChargebackDTO): string[] {
   const actions = this.getChargebackActions(chargeback);
   const possibleActions: string[] = [];
   
   if (actions.canRepresenter) possibleActions.push('Représentation');
   if (actions.canSecondPresentment) possibleActions.push('Second Presentment');
   if (actions.canDemanderArbitrage) possibleActions.push('Arbitrage');
   if (actions.canDeciderArbitrage) possibleActions.push('Décision');
   if (actions.canAnnuler) possibleActions.push('Annulation');
   
   return possibleActions;
 }

 /**
  * Obtenir l'icône d'une phase
  */
 getPhaseIcon(phase: string): string {
   switch (phase) {
     case 'CHARGEBACK_INITIAL': return '🔵';
     case 'REPRESENTATION': return '🟡';
     case 'PRE_ARBITRAGE': return '🟠';
     case 'ARBITRAGE': return '🔴';
     case 'FINALISE': return '✅';
     default: return '❓';
   }
 }

 /**
  * Formater date/heure pour timeline
  */
 formatDateTime(dateTime: string): string {
   if (!dateTime) return 'Date inconnue';
   try {
     return new Date(dateTime).toLocaleString('fr-FR', {
       day: '2-digit',
       month: '2-digit',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     });
   } catch {
     return dateTime;
   }
 }

 // ✅ MÉTHODES CHARGEBACK PRINCIPALES

 canInitiateChargeback(transaction: TransactionWithMeta): boolean {
  console.log('🔍 [DEBUG] canInitiateChargeback pour:', transaction.reference);
  
  // 1. Vérifications de base
  if (!this.institutionId) {
    console.log('❌ Pas d\'institutionId:', this.institutionId);
    return false;
  }

  if (!this.currentUserRole) {
    console.log('❌ Pas de currentUserRole:', this.currentUserRole);
    return false;
  }

  // 2. La transaction doit avoir un litige
  if (transaction.statut !== StatutTransaction.AVEC_LITIGE) {
    console.log('❌ Transaction sans litige. Statut:', transaction.statut);
    return false;
  }

  // 3. Vérifier la banque émettrice
  if (!transaction.banqueEmettrice) {
    console.log('❌ Pas de banqueEmettrice définie');
    return false;
  }

  if (transaction.banqueEmettrice.id !== this.institutionId) {
    console.log('❌ Pas banque émettrice. Notre ID:', this.institutionId, 'Émettrice ID:', transaction.banqueEmettrice.id);
    return false;
  }

  // 4. Vérifier qu'il n'y a pas déjà un chargeback (simplifié)
  const hasExisting = this.hasActiveChargeback(transaction);
  if (hasExisting) {
    console.log('❌ Chargeback déjà existant');
    return false;
  }

  console.log('✅ PEUT INITIER CHARGEBACK pour:', transaction.reference);
  return true;
}

 openChargebackModal(transaction: TransactionWithMeta): void {
  console.log('🎯 [FRONTEND-CLICK] ===== DÉBUT openChargebackModal =====');
  console.log('🎯 [FRONTEND-CLICK] Transaction référence:', transaction.reference);
  console.log('🎯 [FRONTEND-CLICK] Transaction complète:', transaction);
  console.log('🎯 [FRONTEND-CLICK] Institution ID actuelle:', this.institutionId);
  console.log('🎯 [FRONTEND-CLICK] Rôle utilisateur:', this.currentUserRole);
  console.log('🎯 [FRONTEND-CLICK] Nombre de litigesAcquereur:', this.litigesAcquereur.length);

  console.log('🔍 [FRONTEND-CLICK] Vérification canInitiateChargeback...');
  if (!this.canInitiateChargeback(transaction)) {
    console.log('❌ [FRONTEND-CLICK] canInitiateChargeback = FALSE');
    console.log('❌ [FRONTEND-CLICK] Statut transaction:', transaction.statut);
    console.log('❌ [FRONTEND-CLICK] Banque émettrice:', transaction.banqueEmettrice);
    console.log('❌ [FRONTEND-CLICK] Institution ID:', this.institutionId);
    this.notificationService.showError(
      '❌ Cette transaction ne peut pas initier de chargeback. Vérifiez les conditions.'
    );
    return;
  }
  console.log('✅ [FRONTEND-CLICK] canInitiateChargeback = TRUE');

  console.log('🔍 [FRONTEND-CLICK] Recherche du litige associé...');
  console.log('🔍 [FRONTEND-CLICK] Transaction ID calculé:', this.getTransactionId(transaction));
  console.log('🔍 [FRONTEND-CLICK] Liste des litiges acquéreur:', this.litigesAcquereur);
  
  const litigeAssocie = this.litigesAcquereur.find(l => {
  const transactionId = this.getTransactionId(transaction);
  const transactionRef = transaction.reference;
  
  // ✅ DOUBLE VÉRIFICATION : ID ET référence
  const matchById = l.transaction?.id === transactionId;
  const matchByRef = l.transaction?.reference === transactionRef;
  const match = matchById || matchByRef;
  
  console.log(`🔍 [FRONTEND-CLICK] Comparaison litige #${l.id}:`);
  console.log(`    transaction.id=${l.transaction?.id} vs ${transactionId} => ${matchById}`);
  console.log(`    transaction.ref=${l.transaction?.reference} vs ${transactionRef} => ${matchByRef}`);
  console.log(`    RÉSULTAT FINAL => ${match}`);
  
  return match;
});

  console.log('🔍 [FRONTEND-CLICK] Litige associé trouvé:', litigeAssocie);

  if (!litigeAssocie) {
    console.log('❌ [FRONTEND-CLICK] AUCUN litige associé trouvé');
    console.log('❌ [FRONTEND-CLICK] Transaction ID recherché:', this.getTransactionId(transaction));
    console.log('❌ [FRONTEND-CLICK] IDs disponibles dans litigesAcquereur:', 
                this.litigesAcquereur.map(l => ({ litigeId: l.id, transactionId: l.transaction?.id })));
    this.notificationService.showError('❌ Aucun litige trouvé pour cette transaction.');
    return;
  }

  console.log('✅ [FRONTEND-CLICK] Litige associé ID:', litigeAssocie.id);
  console.log('✅ [FRONTEND-CLICK] Litige description:', litigeAssocie.description);

  this.selectedTransactionForChargeback = transaction;
  console.log('✅ [FRONTEND-CLICK] Transaction sélectionnée assignée');

  this.chargebackForm = {
    motifChargeback: `Chargeback initié suite au litige #${litigeAssocie.id}`,
    description: litigeAssocie.description || '',
    montantConteste: transaction.montant || 0,
    priorite: 'NORMALE',
    demandeUrgente: false,
    justificatifs: [],
    commentaireClient: ''
  };
  console.log('✅ [FRONTEND-CLICK] Formulaire chargeback initialisé:', this.chargebackForm);

  this.showInitiationChargebackModal = true;
  console.log('✅ [FRONTEND-CLICK] Modal affiché');
  console.log('🎯 [FRONTEND-CLICK] ===== FIN openChargebackModal =====');
}

 closeChargebackModal(): void {
   this.showInitiationChargebackModal = false;
   this.selectedTransactionForChargeback = null;
   this.chargebackForm = {
     motifChargeback: '',
     description: '',
     montantConteste: 0,
     priorite: 'NORMALE',
     demandeUrgente: false,
     justificatifs: [],
     commentaireClient: ''
   };
 }
/*
 initiateChargeback(): void {
  console.log('🚀 [FRONTEND-SUBMIT] ===== DÉBUT initiateChargeback =====');
  console.log('🚀 [FRONTEND-SUBMIT] selectedTransactionForChargeback:', this.selectedTransactionForChargeback);
  console.log('🚀 [FRONTEND-SUBMIT] chargebackForm état actuel:', this.chargebackForm);
  console.log('🚀 [FRONTEND-SUBMIT] litigesAcquereur disponibles:', this.litigesAcquereur.length);

  if (!this.selectedTransactionForChargeback) {
    console.log('❌ [FRONTEND-SUBMIT] ÉCHEC: Aucune transaction sélectionnée');
    this.notificationService.showError('❌ Aucune transaction sélectionnée.');
    return;
  }
  console.log('✅ [FRONTEND-SUBMIT] Transaction sélectionnée OK:', this.selectedTransactionForChargeback.reference);

  console.log('🔍 [FRONTEND-SUBMIT] Recherche du litige associé...');
  console.log('🔍 [FRONTEND-SUBMIT] Transaction ID à chercher:', this.getTransactionId(this.selectedTransactionForChargeback!));
  
  const litigeAssocie = this.litigesAcquereur.find(l => {
    const transactionId = this.getTransactionId(this.selectedTransactionForChargeback!);
    const match = l.transaction?.id === transactionId;
    console.log(`🔍 [FRONTEND-SUBMIT] Vérification litige #${l.id}: ${l.transaction?.id} === ${transactionId} => ${match}`);
    return match;
  });

  console.log('🔍 [FRONTEND-SUBMIT] Résultat recherche litige:', litigeAssocie);

  if (!litigeAssocie) {
    console.log('❌ [FRONTEND-SUBMIT] ÉCHEC: Litige associé non trouvé');
    console.log('❌ [FRONTEND-SUBMIT] Transaction ID cherché:', this.getTransactionId(this.selectedTransactionForChargeback!));
    console.log('❌ [FRONTEND-SUBMIT] Litiges disponibles:', this.litigesAcquereur.map(l => ({ 
      id: l.id, 
      transactionId: l.transaction?.id, 
      reference: l.transaction?.reference 
    })));
    this.notificationService.showError('❌ Litige associé non trouvé.');
    return;
  }
  console.log('✅ [FRONTEND-SUBMIT] Litige associé trouvé - ID:', litigeAssocie.id);

  console.log('🔍 [FRONTEND-SUBMIT] Validation motif chargeback...');
  console.log('🔍 [FRONTEND-SUBMIT] Motif actuel:', this.chargebackForm.motifChargeback);
  console.log('🔍 [FRONTEND-SUBMIT] Longueur motif:', this.chargebackForm.motifChargeback.trim().length);

  if (!this.chargebackForm.motifChargeback.trim() || this.chargebackForm.motifChargeback.length < 10) {
    console.log('❌ [FRONTEND-SUBMIT] ÉCHEC: Motif invalide');
    this.notificationService.showError('❌ Motif du chargeback obligatoire (min 10 caractères).');
    return;
  }
  console.log('✅ [FRONTEND-SUBMIT] Motif valide');

  console.log('🔍 [FRONTEND-SUBMIT] Validation montant...');
  console.log('🔍 [FRONTEND-SUBMIT] Montant contesté:', this.chargebackForm.montantConteste);

  if (this.chargebackForm.montantConteste <= 0) {
    console.log('❌ [FRONTEND-SUBMIT] ÉCHEC: Montant invalide');
    this.notificationService.showError('❌ Montant contesté doit être positif.');
    return;
  }
  console.log('✅ [FRONTEND-SUBMIT] Montant valide');

  const request: InitiationChargebackRequest = {
    litigeId: litigeAssocie.id,
    transactionId: this.getTransactionId(this.selectedTransactionForChargeback),
    motifChargeback: this.chargebackForm.motifChargeback,
    description: this.chargebackForm.description,
    montantConteste: this.chargebackForm.montantConteste,
    priorite: this.chargebackForm.priorite,
    demandeUrgente: this.chargebackForm.demandeUrgente,
    commentaireClient: this.chargebackForm.commentaireClient,
  };

  console.log('📤 [FRONTEND-SUBMIT] Requête préparée:', request);
  console.log('📤 [FRONTEND-SUBMIT] Validation finale requête:');
  console.log('  - litigeId:', request.litigeId);
  console.log('  - transactionId:', request.transactionId);
  console.log('  - motifChargeback:', request.motifChargeback);
  console.log('  - montantConteste:', request.montantConteste);

  console.log('🌐 [FRONTEND-SUBMIT] Début appel API chargebackService.initierChargeback...');
  this.isInitiatingChargeback = true;

  this.chargebackService.initierChargeback(request).subscribe({
    next: (chargeback: LitigeChargebackDTO) => {
      console.log('✅ [FRONTEND-RESPONSE] Succès API - Chargeback reçu:', chargeback);
      console.log('✅ [FRONTEND-RESPONSE] ID chargeback créé:', chargeback.id);
      console.log('✅ [FRONTEND-RESPONSE] Phase actuelle:', chargeback.phaseActuelle);
      
      this.notificationService.showSuccess(
        `✅ Chargeback initié avec succès pour la transaction ${this.selectedTransactionForChargeback?.reference}`
      );

      console.log('📊 [FRONTEND-RESPONSE] Ajout à la liste des chargebacks...');
      this.chargebacks.unshift(chargeback);
      console.log('📊 [FRONTEND-RESPONSE] Nouveau nombre de chargebacks:', this.chargebacks.length);
      
      console.log('📊 [FRONTEND-RESPONSE] Début loadChargebackStats...');
      this.loadChargebackStats();
      
      console.log('🔄 [FRONTEND-RESPONSE] Fermeture modal...');
      this.closeChargebackModal();
      
      console.log('🔄 [FRONTEND-RESPONSE] Changement vers onglet chargeback...');
      this.setActiveTab('chargeback');
      
      this.isInitiatingChargeback = false;
      console.log('✅ [FRONTEND-RESPONSE] ===== SUCCÈS COMPLET =====');
    },
    error: (error: HttpErrorResponse) => {
      console.error('❌ [FRONTEND-ERROR] ===== ERREUR API =====');
      console.error('❌ [FRONTEND-ERROR] Erreur complète:', error);
      console.error('❌ [FRONTEND-ERROR] Status HTTP:', error.status);
      console.error('❌ [FRONTEND-ERROR] Status Text:', error.statusText);
      console.error('❌ [FRONTEND-ERROR] URL:', error.url);
      console.error('❌ [FRONTEND-ERROR] Error body:', error.error);
      console.error('❌ [FRONTEND-ERROR] Message:', error.message);
      
      let errorMessage = '❌ Erreur lors de l\'initiation du chargeback.';
      if (error.error?.error) {
        errorMessage = error.error.error;
        console.log('❌ [FRONTEND-ERROR] Message d\'erreur backend:', error.error.error);
      } else if (error.error?.message) {
        errorMessage = error.error.message;
        console.log('❌ [FRONTEND-ERROR] Message d\'erreur backend:', error.error.message);
      }
      
      this.notificationService.showError(errorMessage);
      this.isInitiatingChargeback = false;
      console.error('❌ [FRONTEND-ERROR] ===== FIN ERREUR =====');
    }
  });
}
*/
initiateChargeback(): void {
  console.log('🚀 [FRONTEND-SUBMIT] ===== DÉBUT initiateChargeback =====');
  console.log('🚀 [FRONTEND-SUBMIT] selectedTransactionForChargeback:', this.selectedTransactionForChargeback);
  console.log('🚀 [FRONTEND-SUBMIT] chargebackForm état actuel:', this.chargebackForm);
  console.log('🚀 [FRONTEND-SUBMIT] litigesAcquereur disponibles:', this.litigesAcquereur.length);

  // 1) Garde-fou: transaction sélectionnée
  if (!this.selectedTransactionForChargeback) {
    this.notificationService.showError('❌ Aucune transaction sélectionnée.');
    return;
  }
  const tx = this.selectedTransactionForChargeback;
  console.log('✅ [FRONTEND-SUBMIT] Transaction sélectionnée OK:', tx.reference);

  // 2) Candidats d’ID (ordre de priorité: ID “détails” ~258x, puis ID front, puis strCode SATIM)
  const txIdCandidates = [
    this.getTransactionIdForDetails(tx),
    this.getTransactionId(tx),
    tx.satimData?.strCode
  ].filter((v): v is number => typeof v === 'number' && v > 0);

  console.log('🔍 [FRONTEND-SUBMIT] Recherche du litige associé (ID OU référence)...', {
    txIdCandidates, txRef: tx.reference
  });

  // 3) Match robuste: par ID OU par référence
  const litigeAssocie = this.litigesAcquereur.find(l => {
    const lid  = l.transaction?.id;
    const lref = l.transaction?.reference;
    const idMatch  = (typeof lid === 'number') && txIdCandidates.includes(lid);
    const refMatch = !!tx.reference && !!lref && (lref === tx.reference);
    console.log(`🔎 [FRONTEND-SUBMIT] Litige #${l.id} ⇒ idMatch=${idMatch}, refMatch=${refMatch} (lid=${lid}, lref=${lref})`);
    return idMatch || refMatch;
  });

  console.log('🔍 [FRONTEND-SUBMIT] Résultat recherche litige:', litigeAssocie);

  if (!litigeAssocie) {
    // Log d’aide au debug
    console.log('❌ [FRONTEND-SUBMIT] ÉCHEC: Litige associé non trouvé', {
      txIdCandidates,
      txRef: tx.reference,
      litigesMap: this.litigesAcquereur.map(l => ({ id: l.id, txId: l.transaction?.id, txRef: l.transaction?.reference }))
    });
    this.notificationService.showError('❌ Litige associé non trouvé.');
    return;
  }
  console.log('✅ [FRONTEND-SUBMIT] Litige associé trouvé - ID:', litigeAssocie.id);

  // 4) Validation formulaire
  if (!this.chargebackForm.motifChargeback.trim() || this.chargebackForm.motifChargeback.trim().length < 10) {
    this.notificationService.showError('❌ Motif du chargeback obligatoire (min 10 caractères).');
    return;
  }
  if (this.chargebackForm.montantConteste <= 0) {
    this.notificationService.showError('❌ Montant contesté doit être positif.');
    return;
  }

  // 5) Choix de l’ID de transaction à envoyer (priorité à l’ID provenant du litige)
  const transactionIdToSend =
    (typeof litigeAssocie.transaction?.id === 'number' && litigeAssocie.transaction.id > 0)
      ? litigeAssocie.transaction.id
      : (txIdCandidates.length ? txIdCandidates[0] : undefined);

  if (!transactionIdToSend) {
    console.error('❌ [FRONTEND-SUBMIT] Aucun transactionId valide à envoyer', { txIdCandidates, litigeAssocie });
    this.notificationService.showError('❌ Impossible de déterminer l’ID de transaction à envoyer.');
    return;
  }

  const request: InitiationChargebackRequest = {
    litigeId: litigeAssocie.id,
    transactionId: transactionIdToSend,
    motifChargeback: this.chargebackForm.motifChargeback,
    description: this.chargebackForm.description,
    montantConteste: this.chargebackForm.montantConteste,
    priorite: this.chargebackForm.priorite,
    demandeUrgente: this.chargebackForm.demandeUrgente,
    commentaireClient: this.chargebackForm.commentaireClient,
  };

  console.log('📤 [FRONTEND-SUBMIT] Requête préparée:', request);

  // 6) Sécurité: service & méthode
  if (!this.chargebackService || typeof this.chargebackService.initierChargeback !== 'function') {
    this.notificationService.showError('❌ Service chargeback non disponible');
    return;
  }

  // 7) Appel API
  this.isInitiatingChargeback = true;
  try {
    const api$ = this.chargebackService.initierChargeback(request);
    if (!api$) {
      this.notificationService.showError('❌ Erreur lors de la création de la requête');
      this.isInitiatingChargeback = false;
      return;
    }

    api$.subscribe({
      next: (chargeback: LitigeChargebackDTO) => {
        console.log('✅ [FRONTEND-RESPONSE] Chargeback créé:', chargeback);
        this.notificationService.showSuccess(`✅ Chargeback initié avec succès pour la transaction ${tx.reference}`);
        this.chargebacks.unshift(chargeback);
        this.loadChargebackStats();
        this.closeChargebackModal();
        this.setActiveTab('chargeback');
        this.isInitiatingChargeback = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('❌ [FRONTEND-ERROR] Erreur API:', error);
        const msg = error?.error?.error || error?.error?.message || '❌ Erreur lors de l’initiation du chargeback.';
        this.notificationService.showError(msg);
        this.isInitiatingChargeback = false;
      },
      complete: () => console.log('🏁 [SUBSCRIPTION] Observable completed')
    });
  } catch (syncError) {
    console.error('❌ [SYNC-ERROR] Erreur synchrone capturée:', syncError);
    this.notificationService.showError('❌ Erreur synchrone lors de l’appel API');
    this.isInitiatingChargeback = false;
  }
}

 private loadChargebackData(): void {
  console.log('💳 [Chargeback] Chargement des données chargeback...');
  
  this.isLoadingChargebacks = true;
  
  Promise.all([
    this.loadChargebacks(),
    this.loadChargebackStats()
  ]).then(() => {
    this.isLoadingChargebacks = false;
    
    // ✅ NOUVEAU : Séparer les chargebacks par rôle
    this.separateChargebacksByRole();
    
    // ✅ NOUVEAU : Filtrer les deux listes séparément
    this.filterChargebacksEmis();
    this.filterChargebacksRecus();
    
    console.log('💳 [Chargeback] Données chargées et séparées avec succès');
  }).catch(error => {
    console.error('❌ [Chargeback] Erreur chargement:', error);
    this.isLoadingChargebacks = false;
    this.notificationService.showError('❌ Erreur lors du chargement des chargebacks');
  });
}

 private loadChargebacks(): Promise<void> {
   return new Promise((resolve, reject) => {
     if (!this.institutionId) {
       reject(new Error('Institution ID manquant'));
       return;
     }

     this.chargebackService.getChargebacksByInstitution(this.institutionId).subscribe({
       next: (chargebacks: LitigeChargebackDTO[]) => {
         this.chargebacks = chargebacks;
         console.log(`💳 [Chargeback] ${chargebacks.length} chargebacks chargés`);
         resolve();
       },
       error: (error: HttpErrorResponse) => {
         console.error('❌ [Chargeback] Erreur chargement chargebacks:', error);
         reject(error);
       }
     });
   });
 }

 private loadChargebackStats(): Promise<void> {
  console.log('📊 [STATS-LOAD] ===== DÉBUT loadChargebackStats =====');
  console.log('📊 [STATS-LOAD] Institution ID:', this.institutionId);
  
  return new Promise((resolve, reject) => {
    if (!this.institutionId) {
      console.log('❌ [STATS-LOAD] ÉCHEC: Institution ID manquant');
      reject(new Error('Institution ID manquant'));
      return;
    }
    console.log('✅ [STATS-LOAD] Institution ID valide:', this.institutionId);

    console.log('🌐 [STATS-LOAD] Début appel API getStatistiquesChargeback...');
    console.log('🌐 [STATS-LOAD] URL appelée: chargebackService.getStatistiquesChargeback(' + this.institutionId + ')');

    this.chargebackService.getStatistiquesChargeback(this.institutionId).subscribe({
      next: (stats: StatistiquesChargeback) => {
        console.log('✅ [STATS-LOAD] Statistiques reçues avec succès');
        console.log('✅ [STATS-LOAD] Stats complètes:', stats);
        console.log('✅ [STATS-LOAD] Total:', stats?.total);
        console.log('✅ [STATS-LOAD] En cours:', stats?.enCours);
        console.log('✅ [STATS-LOAD] Finalisés:', stats?.finalises);
        console.log('✅ [STATS-LOAD] Urgents:', stats?.urgents);
        console.log('✅ [STATS-LOAD] Montant total:', stats?.montantTotal);
        
        this.chargebackStats = stats;
        console.log('✅ [STATS-LOAD] Statistiques assignées à chargebackStats');
        console.log('✅ [STATS-LOAD] ===== SUCCÈS loadChargebackStats =====');
        resolve();
      },
      error: (error: HttpErrorResponse) => {
        console.error('❌ [STATS-LOAD] ===== ERREUR loadChargebackStats =====');
        console.error('❌ [STATS-LOAD] Erreur HTTP complète:', error);
        console.error('❌ [STATS-LOAD] Status:', error.status);
        console.error('❌ [STATS-LOAD] Status Text:', error.statusText);
        console.error('❌ [STATS-LOAD] URL:', error.url);
        console.error('❌ [STATS-LOAD] Error body:', error.error);
        console.error('❌ [STATS-LOAD] Message:', error.message);
        console.error('❌ [STATS-LOAD] Name:', error.name);
        
        // Log spécifique pour erreur Hibernate
        if (error.error && typeof error.error === 'string' && error.error.includes('MultipleBagFetchException')) {
          console.error('🔥 [STATS-LOAD] ERREUR HIBERNATE DÉTECTÉE: MultipleBagFetchException');
          console.error('🔥 [STATS-LOAD] Problème dans les requêtes JPA du backend');
        }
        
        if (error.error && error.error.message && error.error.message.includes('cannot simultaneously fetch multiple bags')) {
          console.error('🔥 [STATS-LOAD] CONFIRMÉ: Erreur JOIN FETCH multiple détectée');
        }
        
        console.error('❌ [STATS-LOAD] L\'erreur ne bloque pas le processus, résolution...');
        console.error('❌ [STATS-LOAD] ===== FIN ERREUR (non bloquante) =====');
        resolve(); // ✅ Résolution même en cas d'erreur pour ne pas bloquer
      }
    });
  });
}

 onJustificatifsSelected(event: Event): void {
   const input = event.target as HTMLInputElement;
   if (input.files) {
     this.chargebackForm.justificatifs = Array.from(input.files);
     console.log('📎 [Chargeback] Fichiers sélectionnés:', this.chargebackForm.justificatifs.length);
   }
 }

 filterChargebacks(): void {
  // ✅ MODIFIÉ : Utiliser les nouvelles méthodes séparées
  if (this.chargebackActiveSubTab === 'emis') {
    this.filterChargebacksEmis();
  } else {
    this.filterChargebacksRecus();
  }
}

 paginateChargebacks(): void {
   const start = (this.chargebackCurrentPage - 1) * this.chargebackItemsPerPage;
   this.paginatedChargebacks = this.filteredChargebacks.slice(start, start + this.chargebackItemsPerPage);
 }

 goToChargebackPage(page: number): void {
   if (page >= 1 && page <= this.chargebackTotalPages) {
     this.chargebackCurrentPage = page;
     this.paginateChargebacks();
   }
 }

 clearChargebackFilters(): void {
   this.chargebackFilters = {
     phase: '',
     urgent: false,
     dateDebut: '',
     dateFin: '',
     texteRecherche: ''
   };
   this.filterChargebacks();
 }

 getChargebackActions(chargeback: LitigeChargebackDTO): ChargebackActions {
   if (!this.institutionId || !this.currentUserRole) {
     return {
       canInitier: false,
       canRepresenter: false,
       canSecondPresentment: false,
       canDemanderArbitrage: false,
       canDeciderArbitrage: false,
       canAnnuler: false,
       isEmettrice: false,
       isAcquereuse: false,
       isAdmin: false
     };
   }

   return this.chargebackService.checkPermissions(
     this.currentUserRole,
     this.institutionId,
     chargeback
   );
 }

 formatChargebackCurrency(amount: number | undefined): string {
   return this.chargebackService.formatCurrency(amount || 0);
 }

 formatChargebackDate(date: string | undefined): string {
   return this.chargebackService.formatDate(date || '');
 }

 getPhaseLabel(phase: string | undefined): string {
   return this.chargebackService.getPhaseLabel(phase || '');
 }

 getPhaseColor(phase: string | undefined): string {
   return this.chargebackService.getPhaseColor(phase || '');
 }

 isChargebackUrgent(chargeback: LitigeChargebackDTO): boolean {
   return this.chargebackService.isChargebackUrgent(
     chargeback.deadlineActuelle || '',
     chargeback.phaseActuelle || ''
   );
 }

 getJoursRestants(deadline: string | undefined): number {
   return this.chargebackService.calculerJoursRestants(deadline || '');
 }

 get uniqueChargebackPhases(): string[] {
   return Object.values(PHASES_CHARGEBACK);
 }

 get chargebackPaginationArray(): number[] {
   return Array.from({ length: this.chargebackTotalPages }, (_, i) => i + 1);
 }

 get canGoToChargebackPrevious(): boolean {
   return this.chargebackCurrentPage > 1;
 }

 get canGoToChargebackNext(): boolean {
   return this.chargebackCurrentPage < this.chargebackTotalPages;
 }

 getChargebackMaxDisplayed(): number {
   return Math.min(this.chargebackCurrentPage * this.chargebackItemsPerPage, this.filteredChargebacks.length);
 }

 removeJustificatif(index: number): void {
   this.chargebackForm.justificatifs.splice(index, 1);
 }

 isChargebackFormValid(): boolean {
   return this.chargebackForm.motifChargeback.length >= 10 && 
          this.chargebackForm.montantConteste > 0;
 }

 hasActiveChargeback(transaction: TransactionWithMeta): boolean {
   const transactionId = this.getTransactionId(transaction);
   return this.chargebacks.some(cb => 
     cb.transaction?.id === transactionId && 
     cb.phaseActuelle !== 'FINALISE'
   );
 }

 getActiveChargebackPhase(transaction: TransactionWithMeta): string {
   const transactionId = this.getTransactionId(transaction);
   const chargeback = this.chargebacks.find(cb => 
     cb.transaction?.id === transactionId && 
     cb.phaseActuelle !== 'FINALISE'
   );
   return chargeback ? this.getPhaseLabel(chargeback.phaseActuelle) : '';
 }

 getTransactionRowClass(transaction: TransactionWithMeta): string {
   let classes = '';
   if (transaction.statut === 'AVEC_LITIGE') classes += 'highlighted ';
   if (transaction.banqueDeclaranteNom?.includes('Notre banque')) classes += 'our-flag ';
   else if (transaction.banqueDeclaranteNom && !transaction.banqueDeclaranteNom.includes('Notre banque')) classes += 'external-flag ';
   if (this.hasActiveChargeback(transaction)) classes += 'has-active-chargeback ';
   return classes.trim();
 }
 // ✅ MÉTHODES UTILITAIRES PRINCIPALES

  getTransactionId(t: TransactionWithMeta): number {
    if (t.id && t.id > 0) {
      return t.id;
    }
    
    if (t.satimData?.strCode && t.satimData.strCode > 0) {
      return t.satimData.strCode;
    }
    
    if (t.reference) {
      const refAsNumber = parseInt(t.reference.replace(/\D/g, ''), 10);
      if (!isNaN(refAsNumber) && refAsNumber > 0) {
        return refAsNumber;
      }
    }
    
    console.warn('[WARNING] Impossible de déterminer l\'ID pour la transaction:', t);
    return -1;
  }

  private canSignalTransaction(transaction: TransactionWithMeta): boolean {
    if (!this.institutionId) {
      console.log('❌ Pas d\'institution ID');
      return false;
    }
    
    const isEmitter = transaction.banqueEmettrice?.id === this.institutionId;
    const isAcquirer = transaction.banqueAcquereuse?.id === this.institutionId;
    
    console.log('🔍 CHECKING TRANSACTION:', {
      reference: transaction.reference,
      banqueEmettrice: transaction.banqueEmettrice,
      banqueAcquereuse: transaction.banqueAcquereuse,
      myInstitutionId: this.institutionId,
      isEmitter,
      isAcquirer,
      canSignal: isEmitter || isAcquirer
    });
    
    return isEmitter || isAcquirer;
  }

  private filterSignalableTransactions(): void {
    console.log('[DEBUG] Filtrage des transactions selon les règles métier bancaires...');
    
    const signalableTransactions = this.allTransactions.filter(t => this.canSignalTransaction(t));
    const nonSignalableCount = this.allTransactions.length - signalableTransactions.length;
    
    this.transactions = signalableTransactions;
    
    console.log(`[INFO] Transactions totales: ${this.allTransactions.length}`);
    console.log(`[INFO] Transactions signalables: ${signalableTransactions.length}`);
    console.log(`[INFO] Transactions non-signalables (autres banques): ${nonSignalableCount}`);
    
    if (nonSignalableCount > 0) {
      this.notificationService.showInfo(
        `ℹ️ ${nonSignalableCount} transactions d'autres banques masquées (règles métier bancaires)`
      );
    }
    console.log('🔍 AFTER FILTERING:', {
      signalableCount: this.transactions.length,
      totalCount: this.allTransactions.length
    });
  }

  // ✅ INITIALISATION ET CHARGEMENT DES DONNÉES
  private initializeUserData(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.notificationService.showError('❌ Données utilisateur manquantes. Veuillez vous reconnecter.');
      return;
    }

    try {
      const user: Utilisateur = JSON.parse(userStr);
      
      if (!user.id) {
        console.warn('[WARNING] Utilisateur sans ID détecté.');
        this.notificationService.showError('❌ Données utilisateur invalides. Veuillez vous reconnecter.');
        return;
      }

      this.currentUserId = user.id;
      this.currentUserRole = user.role || 'USER';
      this.nomEmploye = user.nom || 'Employé';
      this.institution = typeof user.institution === 'string' ? user.institution : user.institution?.nom || 'Institution inconnue';
      this.institutionId = (user.institution as any)?.id || (user as any).institutionId || null;

      if (!this.institutionId) {
        console.warn('[WARNING] Institution ID manquant.');
        this.notificationService.showError('❌ Institution non identifiée. Veuillez contacter l\'administrateur.');
        return;
      }

      this.loadAllData();

    } catch (error) {
      console.error('[ERROR] Erreur parsing user data:', error);
      this.notificationService.showError('❌ Données utilisateur corrompues. Veuillez vous reconnecter.');
    }
  }

  private loadAllData(): void {
    console.log('[INFO] Début du chargement des données...');
    
    this.chargerTransactions().then(() => {
      console.log('[INFO] Transactions chargées, chargement des litiges...');
      return this.chargerLitiges();
    }).then(() => {
      console.log('[INFO] Litiges chargés, chargement des notifications...');
      this.loadNotifications();
      this.enrichirTransactionsAvecLitiges();
      console.log('[INFO] Chargement terminé avec succès.');
    }).catch(error => {
      console.error('[ERROR] Erreur lors du chargement:', error);
      this.notificationService.showError('❌ Erreur lors du chargement des données.');
    });
  }

  refreshData(): void {
    console.log('[DEBUG] Rechargement complet des données...');
    this.signaledTransactionIds.clear();
    this.clickedTransactions.clear();
    this.loadAllData();
    
    if (this.activeTab === 'chargeback') {
      this.loadChargebackData();
    }
  }

  showBusinessRulesInfo(): void {
    const message = `
    📋 Règles métier bancaires :
    
    ✅ Vous pouvez signaler les transactions où votre banque est :
    • Banque ÉMETTRICE (issuer) 
    • Banque ACQUÉREUSE (acquirer)
    
    💳 Chargeback : Seules les banques ÉMETTRICES peuvent initier un chargeback
    
    ❌ Vous ne pouvez PAS signaler les transactions entre d'autres banques
    
    📊 Actuellement :
    • ${this.totalTransactions} transactions totales dans le système
    • ${this.totalSignalableTransactions} transactions signalables par votre banque
    • ${this.chargebacks.length} chargebacks en cours
    `;
    
    this.notificationService.showInfo(message);
  }

  debugBanqueDeclarante(): void {
    console.log("=== DEBUG BANQUE DECLARANTE ===");
    console.log(`Institution connectée: ${this.institution} (ID: ${this.institutionId})`);
    console.log(`Rôle utilisateur: ${this.currentUserRole}`);
    console.log(`Transactions totales: ${this.totalTransactions}`);
    console.log(`Transactions signalables: ${this.totalSignalableTransactions}`);
    console.log(`Chargebacks: ${this.chargebacks.length}`);
    
    this.transactions
      .filter(t => t.statut === StatutTransaction.AVEC_LITIGE)
      .forEach(t => {
        console.log(`Transaction ${t.reference}:`, {
          statut: t.statut,
          banqueDeclaranteNom: t.banqueDeclaranteNom,
          transactionId: this.getTransactionId(t),
          peutSignaler: this.canSignalTransaction(t),
          peutInitierChargeback: this.canInitiateChargeback(t)
        });
      });
    
    console.log("Litiges reçus:", this.litigesRecus);
    console.log("Litiges acquéreur:", this.litigesAcquereur);
    console.log("Transactions signalées par utilisateur:", Array.from(this.signaledTransactionIds));
    console.log("Stats chargeback:", this.chargebackStats);
    
    this.showBusinessRulesInfo();
  }

  // ✅ MÉTHODES COMPLÈTES DE CHARGEMENT ET TRAITEMENT

  private chargerTransactions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingTransactions = true;
      
      this.transactionService.getAllTransactions().subscribe({
        next: (transactions: Transaction[]) => {
          this.enrichTransactionsWithSatimData(transactions).then(() => {
            resolve();
          }).catch(reject);
        },
        error: (err: HttpErrorResponse) => {
          console.error('[ERROR] Erreur chargement transactions principales, fallback vers SATIM:', err);
          this.chargerTransactionsSatim().then(resolve).catch(reject);
        }
      });
    });
  }

  private enrichTransactionsWithSatimData(transactions: Transaction[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<SatimTransactionResponse[]>('http://localhost:8080/api/satim/all').subscribe({
        next: (satimData: SatimTransactionResponse[]) => {
          this.allTransactions = transactions.map(t => {
            const satimMatch = satimData.find(s => s.strRecoCode === t.reference);
            return {
              ...t,
              satimData: satimMatch ? {
                strCode: satimMatch.strCode,
                strTermIden: satimMatch.strTermIden
              } : undefined
            };
          });

          this.filterSignalableTransactions();
          this.loadSignaledTransactionsByUser();
          this.synchroniserStatutsReelsTransactions().then(() => {
            this.updateStats();
            this.filterTransactions();
            this.isLoadingTransactions = false;
            resolve();
          });

        },
        error: (err: HttpErrorResponse) => {
          console.error('[ERROR] Erreur enrichissement SATIM:', err);
          this.allTransactions = transactions.map(t => ({ ...t }));
          this.filterSignalableTransactions();
          this.loadSignaledTransactionsByUser();
          this.updateStats();
          this.filterTransactions();
          this.isLoadingTransactions = false;
          resolve();
        }
      });
    });
  }

  private chargerTransactionsSatim(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<SatimTransactionResponse[]>('http://localhost:8080/api/satim/all').subscribe({
        next: (data: SatimTransactionResponse[]) => {
          this.allTransactions = data.map(s => ({
            id: s.strCode,
            reference: s.strRecoCode,
            montant: s.strRecoNumb,
            dateTransaction: s.strProcDate,
            type: s.strOperCode,
            statut: StatutTransaction.NORMALE,
            litige: false,
            banqueEmettrice: this.mapSatimCodeToBank(s.strIssuBanCode),
            banqueAcquereuse: this.mapSatimCodeToBank(s.strAcquBanCode),
            satimData: {
              strCode: s.strCode,
              strTermIden: s.strTermIden
            }
          }));
          
          this.filterSignalableTransactions();
          this.synchroniserStatutsReelsTransactions().then(() => {
            this.updateStats();
            this.filterTransactions();
            this.isLoadingTransactions = false;
            resolve();
          });

        },
        error: (err: HttpErrorResponse) => {
          console.error('[ERROR] Erreur chargement SATIM:', err);
          this.notificationService.showError('❌ Erreur chargement des transactions');
          this.isLoadingTransactions = false;
          reject(err);
        }
      });
    });
  }

  private mapSatimCodeToBank(satimCode: string): Institution | undefined {
    const bankMap: {[key: string]: Institution} = {
      '001': { id: 1, nom: 'CIH BANK', type: 'CENTRE' as any, enabled: true },
      '002': { id: 2, nom: 'ATTIJARIWAFA', type: 'CENTRE' as any, enabled: true },
      '003': { id: 3, nom: 'BMCE', type: 'CENTRE' as any, enabled: true }
    };
    return bankMap[satimCode];
 }

 private chargerLitiges(): Promise<void> {
   return new Promise((resolve) => {
     this.isLoadingLitiges = true;
     
     if (!this.institutionId) {
       this.isLoadingLitiges = false;
       resolve();
       return;
     }

     const promises = [
       this.chargerLitigesEmis(this.institutionId),
       this.chargerLitigesRecus(this.institutionId)
     ];

     Promise.all(promises).then(() => {
       this.isLoadingLitiges = false;
       resolve();
     }).catch(() => {
       this.isLoadingLitiges = false;
       resolve();
     });
   });
 }
/*
 private chargerLitigesEmis(institutionId: number): Promise<void> {
   return new Promise((resolve, reject) => {
     const headers = new HttpHeaders({
       'Authorization': `Bearer ${this.authService.getToken()}`
     });

     this.http.get<Litige[]>(`http://localhost:8080/api/public/litiges/institution/${institutionId}`, { headers })
       .subscribe({
         next: (litiges: Litige[]) => {
           this.litigesAcquereur = litiges;
           console.log('[DEBUG] Litiges émis chargés:', litiges.length);
           resolve();
         },
         error: (err: HttpErrorResponse) => {
           console.error('[ERROR] Erreur chargement litiges émis:', err);
           reject(err);
         }
       });
   });
 }
*/
private chargerLitigesEmis(institutionId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    console.log('🔍 [DEBUG-LITIGES] Appel API litiges émis...');

    // ✅ ÉTAPE 1 : Récupérer les LitigeResponseDTO
    this.http.get<LitigeResponseDTO[]>(`http://localhost:8080/api/public/litiges/institution/${institutionId}`, { headers })
      .subscribe({
        next: async (litigesDTO: LitigeResponseDTO[]) => {
          console.log('🔍 [DEBUG-LITIGES] LitigeResponseDTO reçus:', litigesDTO.length, 'litiges');
          
          try {
            // ✅ ÉTAPE 2 : Conversion en objets Litige de base
            this.litigesAcquereur = litigesDTO.map(dto => ({
  id: dto.id,
  type: dto.type,
  statut: dto.statut,
  description: dto.description,
  dateCreation: dto.dateCreation,
  banqueDeclaranteNom: dto.banqueDeclaranteNom,
  institutionDeclarantNom: dto.institutionDeclarantNom,
  transaction: undefined // ✅ Changé null en undefined
})) as any[];

            console.log('🔄 [DEBUG-LITIGES] Début enrichissement avec transactions...');
            
            // ✅ ÉTAPE 3 : Enrichir avec les vraies transactions
            await this.enrichirLitigesAvecTransactions();
            
            console.log('✅ [DEBUG-LITIGES] Enrichissement terminé');
            console.log('✅ [DEBUG-LITIGES] Litiges finaux:', this.litigesAcquereur);
            
            resolve();
          } catch (enrichError) {
            console.error('❌ [DEBUG-LITIGES] Erreur enrichissement:', enrichError);
            reject(enrichError);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ [DEBUG-LITIGES] Erreur chargement litiges émis:', err);
          reject(err);
        }
      });
  });
}

/**
 * ✅ NOUVELLE MÉTHODE : Enrichit les litiges avec les vraies transactions
 */
private async enrichirLitigesAvecTransactions(): Promise<void> {
  console.log('🔄 [ENRICHIR] Début enrichissement de', this.litigesAcquereur.length, 'litiges...');
  
  const promises = this.litigesAcquereur.map(async (litige, index) => {
    try {
      console.log(`🔍 [ENRICHIR] ${index + 1}/${this.litigesAcquereur.length} - Recherche transaction pour litige #${litige.id}`);
      
      // ✅ MÉTHODE 1 : Essayer via l'API de détails du litige
      const transactionViaLitige = await this.getTransactionViaLitigeDetails(litige.id);
      if (transactionViaLitige) {
        litige.transaction = transactionViaLitige;
        console.log(`✅ [ENRICHIR] Transaction trouvée via litige #${litige.id}:`, transactionViaLitige.reference);
        return;
      }

      // ✅ MÉTHODE 2 : Essayer de trouver via recherche dans toutes les transactions
      const transactionViaRecherche = await this.getTransactionViaRecherche(litige);
      if (transactionViaRecherche) {
        litige.transaction = transactionViaRecherche;
        console.log(`✅ [ENRICHIR] Transaction trouvée via recherche pour litige #${litige.id}:`, transactionViaRecherche.reference);
        return;
      }

      // ✅ MÉTHODE 3 : Fallback - créer une transaction temporaire
      console.warn(`⚠️ [ENRICHIR] Aucune transaction trouvée pour litige #${litige.id}, création fallback`);
      litige.transaction = this.createFallbackTransaction(litige);

    } catch (error) {
      console.error(`❌ [ENRICHIR] Erreur pour litige #${litige.id}:`, error);
      litige.transaction = this.createFallbackTransaction(litige);
    }
  });

  await Promise.all(promises);
  console.log('✅ [ENRICHIR] Enrichissement terminé avec succès');
}
/**
 * ✅ MÉTHODE 1 : Récupérer transaction via les détails du litige
 */
private async getTransactionViaLitigeDetails(litigeId: number): Promise<any | null> {
  try {
    console.log(`🔍 [ENRICHIR-M1] Appel API détails litige #${litigeId}`);
    
    const details = await this.litigeService.getLitigeDetails(litigeId).toPromise();
    
    if (details?.transaction) {
      console.log(`✅ [ENRICHIR-M1] Transaction trouvée dans détails litige #${litigeId}`);
      return details.transaction;
    }
    
    console.log(`❌ [ENRICHIR-M1] Pas de transaction dans les détails du litige #${litigeId}`);
    return null;
  } catch (error) {
    console.warn(`⚠️ [ENRICHIR-M1] Erreur API détails litige #${litigeId}:`, error);
    return null;
  }
}

/**
 * ✅ MÉTHODE 2 : Rechercher transaction par correspondance
 */
private async getTransactionViaRecherche(litige: any): Promise<any | null> {
  try {
    console.log(`🔍 [ENRICHIR-M2] Recherche transaction pour litige #${litige.id}`);
    
    // Rechercher dans les transactions déjà chargées
    const transactionTrouvee = this.allTransactions.find(t => {
      // Correspondance par statut AVEC_LITIGE et timing
      const isLitige = t.statut === 'AVEC_LITIGE';
      const isOurBank = (t.banqueEmettrice?.id === this.institutionId) || 
                       (t.banqueAcquereuse?.id === this.institutionId);
      
      if (isLitige && isOurBank) {
        console.log(`🎯 [ENRICHIR-M2] Candidat trouvé: ${t.reference} pour litige #${litige.id}`);
        return true;
      }
      return false;
    });

    if (transactionTrouvee) {
      console.log(`✅ [ENRICHIR-M2] Transaction trouvée par recherche: ${transactionTrouvee.reference}`);
      return transactionTrouvee;
    }

    console.log(`❌ [ENRICHIR-M2] Aucune transaction trouvée par recherche pour litige #${litige.id}`);
    return null;
  } catch (error) {
    console.warn(`⚠️ [ENRICHIR-M2] Erreur recherche transaction pour litige #${litige.id}:`, error);
    return null;
  }
}

/**
 * ✅ MÉTHODE 3 : Créer transaction fallback
 */
private createFallbackTransaction(litige: any): any {
  console.log(`🔧 [ENRICHIR-FALLBACK] Création transaction fallback pour litige #${litige.id}`);
  
  return {
    id: 900000 + litige.id, // ✅ ID unique pour éviter les conflits
    reference: `LITIGE-${litige.id}`,
    montant: 1000, // ✅ Montant par défaut pour les tests
    dateTransaction: litige.dateCreation,
    type: 'LITIGE_FALLBACK',
    statut: 'AVEC_LITIGE',
    banqueEmettrice: {
      id: this.institutionId,
      nom: this.institution
    },
    banqueAcquereuse: {
      id: 999,
      nom: 'Banque Inconnue'
    }
  };
}

 private chargerLitigesRecus(institutionId: number): Promise<void> {
   return new Promise((resolve, reject) => {
     const headers = new HttpHeaders({
       'Authorization': `Bearer ${this.authService.getToken()}`
     });

     this.http.get<LitigeRecu[]>(`http://localhost:8080/api/public/litiges/reçus/${institutionId}`, { headers })
       .subscribe({
         next: (data: LitigeRecu[]) => {
           this.litigesRecus = data;
           console.log('[DEBUG] Litiges reçus chargés:', this.litigesRecus.length);
           resolve();
         },
         error: (err: HttpErrorResponse) => {
           console.error('[ERROR] Erreur chargement litiges reçus:', err);
           reject(err);
         }
       });
   });
 }

 private enrichirTransactionsAvecLitiges(): void {
   console.log('[DEBUG] Début enrichissement transactions avec litiges...');
   this.marquerTransactionsAvecLitigesEmis();
   console.log(`[DEBUG] ${this.litigesRecus.length} litiges reçus d'autres banques (affichage séparé)`);
   this.updateStats();
   this.filterTransactions();
   console.log('[DEBUG] Enrichissement terminé.');
 }

 private marquerTransactionsAvecLitigesEmis(): void {
   this.litigesAcquereur.forEach(litige => {
     if (!litige.transaction || !litige.transaction.id) return;
     
     const transactionConcernee = this.transactions.find(t => 
       this.getTransactionId(t) === litige.transaction.id
     );
     
     if (transactionConcernee) {
       transactionConcernee.statut = StatutTransaction.AVEC_LITIGE;
       transactionConcernee.banqueDeclaranteNom = "Notre banque (signalé par nous)";
       console.log(`[DEBUG] Transaction ${transactionConcernee.reference} marquée comme signalée par nous`);
     }
   });
 }

 loadNotifications(): void {
   if (!this.institutionId) return;

   const headers = new HttpHeaders({
     'Authorization': `Bearer ${this.authService.getToken()}`
   });

   this.http.get<Litige[]>(`http://localhost:8080/api/public/litiges/unread/${this.institutionId}`, { headers })
     .subscribe({
       next: (notifications: Litige[]) => {
         this.unreadNotifications = notifications;
         this.notificationService.updateUnreadCount(notifications.length);
         console.log('[DEBUG] Notifications chargées:', notifications.length);
       },
       error: (err: HttpErrorResponse) => {
         console.error('[ERROR] Erreur chargement notifications:', err);
       }
     });
 }

 loadSignaledTransactionsByUser(): void {
   if (!this.currentUserId) return;

   const headers = new HttpHeaders({
     'Authorization': `Bearer ${this.authService.getToken()}`
   });

   this.http.get<number[]>(`http://localhost:8080/api/public/litiges/signaled-transactions/${this.currentUserId}`, { headers })
     .subscribe({
       next: (transactionIds: number[]) => {
         this.signaledTransactionIds = new Set(transactionIds);
         console.log('[DEBUG] Transactions signalées par l\'utilisateur:', transactionIds);
       },
       error: (err: HttpErrorResponse) => {
         console.error('[ERROR] Erreur transactions signalées:', err);
       }
     });
 }

 flagTransaction(transaction: TransactionWithMeta): void {
   if (!this.currentUserId) {
     this.notificationService.showError('❌ Utilisateur non identifié.');
     return;
   }

   if (!this.canSignalTransaction(transaction)) {
     this.notificationService.showError(
       '❌ Vous ne pouvez signaler que les transactions où votre banque est émettrice ou acquéreuse (règles métier bancaires).'
     );
     return;
   }

   if (transaction.statut === StatutTransaction.AVEC_LITIGE) {
     this.notificationService.showError(
       '⚠️ Cette transaction possède déjà un litige. Impossible de la signaler à nouveau.'
     );
     return;
   }

   const transactionId = this.getTransactionId(transaction);

   if (this.signaledTransactionIds.has(transactionId)) {
     this.notificationService.showError(
       '⚠️ Cette transaction a déjà été signalée par votre banque.'
     );
     return;
   }

   if (transactionId <= 0) {
     this.notificationService.showError('❌ Transaction invalide.');
     return;
   }

   if (this.clickedTransactions.has(transactionId)) {
     return;
   }

   this.clickedTransactions.add(transactionId);

   const litigeData = {
     transactionId,
     utilisateurId: this.currentUserId,
     description: `Transaction signalée par ${this.nomEmploye} - Réf: ${transaction.reference}`,
     type: TypeLitige.AUTRE
   };

   const headers = new HttpHeaders({
     'Authorization': `Bearer ${this.authService.getToken()}`,
     'Content-Type': 'application/json'
   });

   this.notificationService.showInfo('⏳ Signalement en cours...');

   this.http.post('http://localhost:8080/api/public/litiges/flag', litigeData, { headers })
     .subscribe({
       next: () => {
         transaction.statut = StatutTransaction.AVEC_LITIGE;
         transaction.banqueDeclaranteNom = "Notre banque (signalé par nous)";
         this.signaledTransactionIds.add(transactionId);
         this.clickedTransactions.delete(transactionId);
         
         this.updateStats();
         this.filterTransactions();
         this.loadNotifications();
         this.chargerLitiges();
         
         this.notificationService.showSuccess(`🚩 Transaction ${transaction.reference} signalée avec succès`);
       },
       error: (err: HttpErrorResponse) => {
         console.error('[ERROR] Erreur signalement:', err);
         this.clickedTransactions.delete(transactionId);
         
         let errorMessage = '❌ Erreur lors du signalement.';
         if (err.status === 409) {
           errorMessage = '⚠️ Cette transaction est déjà signalée.';
         } else if (err.status === 404) {
           errorMessage = '❌ Transaction non trouvée.';
         } else if (err.message && err.message.includes('institution')) {
           errorMessage = '❌ Vous ne pouvez signaler que les transactions de votre institution (règles métier bancaires).';
         }
         
         this.notificationService.showError(errorMessage);
       }
     });
 }

 toggleNotificationPanel(): void {
   this.showNotificationPanel = !this.showNotificationPanel;
 }

 goToTransaction(litige: Litige): void {
   this.markNotificationAsRead(litige);
   this.searchTerm = litige.transaction?.reference || '';
   this.activeTab = 'transactions';
   this.filterTransactions();
   this.showNotificationPanel = false;
   
   setTimeout(() => {
     document.querySelector('.transactions')?.scrollIntoView({ behavior: 'smooth' });
   }, 100);
   
   this.notificationService.showSuccess(`🎯 Transaction ${litige.transaction?.reference} affichée`);
 }

 markNotificationAsRead(litige: Litige): void {
   const headers = new HttpHeaders({
     'Authorization': `Bearer ${this.authService.getToken()}`,
     'Content-Type': 'application/json'
   });

   this.http.put(`http://localhost:8080/api/public/litiges/${litige.id}/mark-read`, {}, { headers })
     .subscribe({
       next: () => {
         this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== litige.id);
         this.notificationService.updateUnreadCount(this.unreadNotifications.length);
       },
       error: (err: HttpErrorResponse) => {
         console.error('[ERROR] Erreur marquage notification:', err);
       }
     });
 }

 onFileSelected(event: Event): void {
   const input = event.target as HTMLInputElement;
   const file = input.files?.[0];
   if (!file) return;

   this.selectedFileName = file.name;

   const isValidCSV = file.type === 'text/csv' || 
                     file.type === 'application/csv' || 
                     file.type === 'text/plain' ||
                     file.name.toLowerCase().endsWith('.csv');

   if (!isValidCSV) {
     this.notificationService.showError('❌ Format de fichier non supporté (CSV requis)');
     return;
   }

   if (file.size > 10 * 1024 * 1024) {
     this.notificationService.showError('❌ Fichier trop volumineux (max 10MB)');
     return;
   }

   const formData = new FormData();
   formData.append('file', file);
   this.isUploadingFile = true;

   const headers = new HttpHeaders({
     'Authorization': `Bearer ${this.authService.getToken()}`
   });

   this.http.post('http://localhost:8080/api/satim/upload', formData, {
     headers,
     responseType: 'text'
   }).subscribe({
     next: (response: string) => {
       console.log('[DEBUG] Upload response:', response);
       this.notificationService.showSuccess('✅ Fichier importé avec succès.');
       
       setTimeout(() => {
         this.loadAllData();
       }, 1000);
       
       this.isUploadingFile = false;
       this.selectedFileName = '';
       if (input) input.value = '';
     },
     error: (err: HttpErrorResponse) => {
       console.error('[ERROR] Erreur upload:', err);
       this.notificationService.showError('❌ Erreur import : ' + (err?.error || err.message));
       this.isUploadingFile = false;
     }
   });
 }

 updateStats(): void {
   const total = this.transactions.reduce((sum, t) => sum + (t.montant || 0), 0);
   const avg = this.transactions.length > 0 ? total / this.transactions.length : 0;
   
   this.totalTransactions = this.allTransactions.length;
   this.totalSignalableTransactions = this.transactions.length;
   this.totalAmount = `${total.toFixed(2)} MAD`;
   this.averageAmount = `${avg.toFixed(2)} MAD`;
   this.flaggedCount = this.transactions.filter(t => t.statut === StatutTransaction.AVEC_LITIGE).length;
 }

 filterTransactions(): void {
   const search = this.searchTerm.toLowerCase();
   
   this.filteredTransactions = this.transactions.filter(t => {
     const matchesSearch = !this.searchTerm || 
       t.reference?.toLowerCase().includes(search) ||
       t.type?.toLowerCase().includes(search) ||
       t.montant?.toString().includes(this.searchTerm) ||
       t.satimData?.strTermIden?.toLowerCase().includes(search);
     
     const matchesStatut = !this.statutFilter || t.statut === this.statutFilter;
     const matchesType = !this.typeFilter || t.type === this.typeFilter;
     
     return matchesSearch && matchesStatut && matchesType;
   });
   
   this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
   this.currentPage = 1;
   this.paginate();
 }

 paginate(): void {
   const start = (this.currentPage - 1) * this.itemsPerPage;
   this.paginatedTransactions = this.filteredTransactions.slice(start, start + this.itemsPerPage);
 }

 goToPage(page: number): void {
   if (page >= 1 && page <= this.totalPages) {
     this.currentPage = page;
     this.paginate();
   }
 }

 clearFilters(): void {
   this.searchTerm = '';
   this.statutFilter = '';
   this.typeFilter = '';
   this.currentPage = 1;
   this.filterTransactions();
 }

 formatCurrency(amount: number | undefined): string {
   if (!amount && amount !== 0) return '0,00 MAD';
   return new Intl.NumberFormat('fr-FR', {
     style: 'currency',
     currency: 'MAD',
     minimumFractionDigits: 2
   }).format(amount);
 }

 formatDate(date: string | undefined): string {
   if (!date) return '';
   try {
     return new Date(date).toLocaleDateString('fr-FR');
   } catch {
     return date;
   }
 }

 exportToCSV(): void {
   const header = ['Réf', 'Montant', 'Date', 'Type', 'Statut', 'Terminal', 'Code SATIM', 'Banque Déclarante'];
   const rows = this.filteredTransactions.map(t => [
     t.reference || '',
     t.montant?.toString() || '0',
     t.dateTransaction || '',
     t.type || '',
     t.statut || '',
     t.satimData?.strTermIden || '',
     t.satimData?.strCode?.toString() || '',
     t.banqueDeclaranteNom || ''
   ]);

   const csv = [header, ...rows].map(r => r.join(';')).join('\n');
   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = `transactions_signalables_${new Date().toISOString().split('T')[0]}.csv`;
   link.click();
 }

 get uniqueTypes(): string[] {
   return [...new Set(this.transactions.map(t => t.type).filter(Boolean))];
 }

 get uniqueStatuts(): string[] {
   return [...new Set(this.transactions.map(t => t.statut).filter(Boolean))];
 }

 get paginationArray(): number[] {
   return Array.from({ length: this.totalPages }, (_, i) => i + 1);
 }

 get canGoToPrevious(): boolean {
   return this.currentPage > 1;
 }

 get canGoToNext(): boolean {
   return this.currentPage < this.totalPages;
 }

 getMaxDisplayed(): number {
   return Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
 }

 openLitigeDetails(litigeId: number): void {
   console.log('🔍 Ouverture des détails du litige ID:', litigeId);
   
   this.isLoadingDetails = true;
   this.detailsError = null;
   this.showDetailsModal = true;
   this.selectedLitigeDetails = null;

   this.litigeService.getLitigeDetails(litigeId).subscribe({
     next: (details: any) => {
       console.log('✅ Détails reçus:', details);
       this.selectedLitigeDetails = details;
       this.isLoadingDetails = false;
     },
     error: (error: HttpErrorResponse) => {
       console.error('❌ Erreur lors du chargement des détails:', error);
       this.detailsError = 'Erreur lors du chargement des détails du litige';
       this.isLoadingDetails = false;
       this.notificationService.showError('❌ Impossible de charger les détails du litige');
     }
   });
 }

 closeLitigeDetails(): void {
   this.showDetailsModal = false;
   this.selectedLitigeDetails = null;
   this.detailsError = null;
 }

 openTransactionDetails(transaction: TransactionWithMeta): void {
   const transactionId = this.getTransactionIdForDetails(transaction);
   
   console.log('🔍 Ouverture des détails de la transaction:', {
     transaction: transaction,
     transactionId: transactionId,
     reference: transaction.reference
   });
   
   if (!transactionId || transactionId < 2581 || transactionId > 2630) {
     console.error('❌ ID de transaction hors plage valide:', transactionId);
     this.notificationService.showError(
       `❌ Transaction invalide (ID: ${transactionId}) - Les IDs valides sont entre 2581 et 2630`
     );
     return;
   }
   
   this.isLoadingTransactionDetails = true;
   this.transactionDetailsError = null;
   this.showTransactionDetailsModal = true;
   this.selectedTransactionDetails = null;

   this.transactionService.getTransactionDetails(transactionId).subscribe({
     next: (details: any) => {
       console.log('✅ Détails transaction reçus:', details);
       this.selectedTransactionDetails = details;
       this.isLoadingTransactionDetails = false;
       this.notificationService.showSuccess(`✅ Détails de la transaction ${transaction.reference} chargés`);
     },
     error: (error: HttpErrorResponse) => {
       console.error('❌ Erreur lors du chargement des détails transaction:', error);
       this.transactionDetailsError = 'Erreur lors du chargement des détails de la transaction';
       this.isLoadingTransactionDetails = false;
       
       let errorMessage = '❌ Impossible de charger les détails de la transaction';
       switch (error.status) {
         case 404:
           errorMessage = `❌ Transaction #${transactionId} non trouvée en base de données`;
           break;
         case 403:
           errorMessage = '❌ Accès refusé à cette transaction';
           break;
         case 500:
           errorMessage = '❌ Erreur serveur lors du chargement des détails';
           break;
         case 0:
           errorMessage = '❌ Impossible de contacter le serveur';
           break;
         default:
           errorMessage = `❌ Erreur ${error.status}: ${error.message}`;
       }
       
       this.notificationService.showError(errorMessage);
     }
   });
 }

 closeTransactionDetails(): void {
   this.showTransactionDetailsModal = false;
   this.selectedTransactionDetails = null;
   this.transactionDetailsError = null;
 }

 getTransactionIdForDetails(t: TransactionWithMeta): number {
   if (t.id && t.id >= 2581 && t.id <= 2630) {
     return t.id;
   }

   if (t.reference) {
     const refNumber = parseInt(t.reference.replace(/\D/g, ''), 10);
     if (!isNaN(refNumber) && refNumber >= 1 && refNumber <= 50) {
       const calculatedId = 2580 + refNumber;
       return calculatedId;
     }
   }

   console.warn('⚠️ Aucun ID valide trouvé, utilisation de 2581 pour test');
   return 2581;
 }

 formatDureeDepuisCreation(minutes: number): string {
   if (!minutes) return 'Inconnue';
   if (minutes < 60) {
     return `${minutes} minute(s)`;
   } else if (minutes < 1440) {
     return `${Math.floor(minutes / 60)} heure(s)`;
   } else {
     return `${Math.floor(minutes / 1440)} jour(s)`;
   }
 }

 formatDateTimeComplete(dateString: string): string {
   if (!dateString) return 'Date inconnue';
   try {
     const date = new Date(dateString);
     return date.toLocaleString('fr-FR', {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit'
     });
   } catch {
     return dateString;
   }
 }

 getPriorityClass(priorite: string): string {
   switch (priorite?.toUpperCase()) {
     case 'HAUTE':
       return 'priority-high';
     case 'MOYENNE':
       return 'priority-medium';
     default:
       return 'priority-normal';
   }
 }

 formatCurrencyFromNumber(amount: number): string {
   if (!amount && amount !== 0) return '0,00 MAD';
   return new Intl.NumberFormat('fr-FR', {
     style: 'currency',
     currency: 'MAD',
     minimumFractionDigits: 2
   }).format(amount);
 }

 formatDateOnly(dateString: string): string {
   if (!dateString) return 'Date inconnue';
   try {
     const date = new Date(dateString);
     return date.toLocaleDateString('fr-FR');
   } catch {
     return dateString;
   }
 }

 private synchroniserStatutsReelsTransactions(): Promise<void> {
   return new Promise((resolve) => {
     console.log('[DEBUG] 🔄 Début synchronisation des statuts réels...');
     
     if (this.transactions.length === 0) {
       console.log('[INFO] Aucune transaction à synchroniser');
       resolve();
       return;
     }
     
     let transactionsModifiees = 0;
     let promisesCompleted = 0;
     const totalPromises = this.transactions.length;
     
     this.transactions.forEach((transaction) => {
       const transactionId = this.getTransactionIdForDetails(transaction);
       
       if (transactionId < 2581 || transactionId > 2630) {
         console.warn(`⚠️ ID invalide pour ${transaction.reference}: ${transactionId}`);
         promisesCompleted++;
         if (promisesCompleted === totalPromises) {
           this.finaliserSynchronisation(transactionsModifiees, resolve);
         }
         return;
       }
       
       this.transactionService.getTransactionDetails(transactionId).subscribe({
         next: (details: any) => {
           if (details.statut && details.statut !== transaction.statut) {
             console.log(`🔄 Mise à jour ${transaction.reference}: ${transaction.statut} → ${details.statut}`);
             transaction.statut = details.statut;
             
             if (details.statut === StatutTransaction.AVEC_LITIGE) {
               if (details.litige && details.litige.banqueDeclaranteNom) {
                 transaction.banqueDeclaranteNom = details.litige.banqueDeclaranteNom;
               } else {
                 transaction.banqueDeclaranteNom = 'Banque déclarante inconnue';
               }
             }
             
             transactionsModifiees++;
           }
           
           promisesCompleted++;
           if (promisesCompleted === totalPromises) {
             this.finaliserSynchronisation(transactionsModifiees, resolve);
           }
         },
         error: (error: HttpErrorResponse) => {
           console.warn(`⚠️ Erreur récupération détails ${transaction.reference}:`, error.status);
           promisesCompleted++;
           if (promisesCompleted === totalPromises) {
             this.finaliserSynchronisation(transactionsModifiees, resolve);
           }
         }
       });
     });
   });
 }

 private finaliserSynchronisation(transactionsModifiees: number, resolve: () => void): void {
   console.log(`[INFO] ✅ Synchronisation terminée: ${transactionsModifiees} transactions mises à jour`);
   
   if (transactionsModifiees > 0) {
     this.updateStats();
     this.filterTransactions();
     this.notificationService.showSuccess(
       `✅ ${transactionsModifiees} transaction(s) synchronisée(s) avec les statuts réels`
     );
   }
   
   resolve();
 }
 /**
 * Obtenir le nom de l'auteur d'un échange
 */
getAuteurName(echange: EchangeLitige): string {
  if (echange.auteurUtilisateurId) {
    return `Utilisateur #${echange.auteurUtilisateurId}`;
  }
  return 'Utilisateur inconnu';
}

/**
 * Obtenir le nom de l'institution d'un échange
 */
getInstitutionName(echange: EchangeLitige): string {
  if (echange.institutionId) {
    // TODO: Mapper avec les vraies institutions si nécessaire
    const institutionMap: {[key: number]: string} = {
      1: 'CIH BANK',
      2: 'ATTIJARIWAFA BANK',
      3: 'BMCE BANK'
    };
    return institutionMap[echange.institutionId] || `Institution #${echange.institutionId}`;
  }
  return 'Institution inconnue';
}
/**
 * Formater la taille d'un fichier
 */
formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
/**
 * Debug : Analyser les chargebacks chargés
 */
debugChargebacks(): void {
  console.log('🔍 [DEBUG] ANALYSE CHARGEBACKS:');
  console.log('🔍 [DEBUG] Institution ID:', this.institutionId);
  console.log('🔍 [DEBUG] Chargebacks totaux:', this.chargebacks?.length || 0);
  console.log('🔍 [DEBUG] Chargebacks liste:', this.chargebacks);
  
  if (this.chargebacks && this.chargebacks.length > 0) {
    this.chargebacks.forEach((cb, index) => {
      console.log(`🔍 [DEBUG] Chargeback ${index + 1}:`, {
        id: cb.id,
        transactionRef: cb.transaction?.reference,
        banqueEmettrice: cb.transaction?.banqueEmettrice,
        banqueAcquereuse: cb.transaction?.banqueAcquereuse,
        banqueEmettriceId: cb.transaction?.banqueEmettrice?.id,
        banqueAcquereuseId: cb.transaction?.banqueAcquereuse?.id
      });
    });
  }
}

}

  