import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArbitrageAdminService, ArbitrageDashboard, ArbitrageEnAttente } from '../../services/arbitrage-admin.service';
import { NotificationService } from '../../services/notification.service';

// Interfaces pour le dossier complet
export interface DossierArbitrageComplet {
  arbitrage: {
    id: number;
    litigeId: number;
    dateDemande: string;
    joursAttente: number;
    statut: string;
    urgence: string;
    montantConteste: number;
    coutArbitrage: number;
    institutionDemandeuse: string;
  };
  transaction: {
    reference: string;
    montant: number;
    dateTransaction: string;
    type: string;
  };
  banqueEmettrice: { 
    id: number; 
    nom: string; 
  };
  banqueAcquereuse: { 
    id: number; 
    nom: string; 
  };
  chargeback: {
    motifInitial: string;
    phaseActuelle: string;
    argumentsEmetteur: string[];
    argumentsAcquereur: string[];
    dateInitiation: string;
    dateRepresentation?: string;
    dateSecondPresentment?: string;
  };
  historique: Array<{
    id: number;
    date: string;
    phase: string;
    action: string;
    auteur: string;
    institution: string;
    details: string;
  }>;
  justificatifs: Array<{
    id: number;
    nom: string;
    type: string;
    phase: string;
    taille: number;
    dateAjout: string;
    institution: string;
    chemin: string;
  }>;
}

export interface DecisionArbitrageRequest {
  decision: 'FAVORABLE_EMETTEUR' | 'FAVORABLE_ACQUIREUR' | 'PARTAGE' | 'REJET';
  motifsDecision: string;
  repartitionFrais: 'DEMANDEUR' | 'DEFENDEUR' | 'PARTAGE' | 'PERDANT';
  montantAccorde?: number;
  delaiExecution?: number;
  commentairesSupplementaires?: string;
}

@Component({
  selector: 'app-admin-arbitrages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-arbitrages.component.html',
  styleUrls: ['./admin-arbitrages.component.css']
})
export class AdminArbitragesComponent implements OnInit {
  
  dashboard: ArbitrageDashboard | null = null;
  arbitragesEnAttente: ArbitrageEnAttente[] = [];
  isLoading = true;
  error: string | null = null;

  // Modal de consultation
  showDetailsModal = false;
  selectedArbitrage: ArbitrageEnAttente | null = null;
  dossierComplet: any = null;
  isLoadingDetails = false;
  activeTab: 'resume' | 'historique' | 'justificatifs' | 'decision' = 'resume';

  // Formulaire de décision
  decisionForm: DecisionArbitrageRequest = {
    decision: 'FAVORABLE_EMETTEUR',
    motifsDecision: '',
    repartitionFrais: 'PERDANT',
    montantAccorde: undefined,
    delaiExecution: 30,
    commentairesSupplementaires: ''
  };
  
  isProcessingDecision = false;
  showConfirmDecisionModal = false;

  constructor(
    private arbitrageService: ArbitrageAdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.error = null;

    // Charger le dashboard
    this.arbitrageService.getDashboardArbitrage().subscribe({
      next: (data) => {
        this.dashboard = data;
      },
      error: (error) => {
        console.error('Erreur chargement dashboard arbitrages:', error);
        this.error = 'Erreur lors du chargement du dashboard';
      }
    });

    // Charger les arbitrages en attente
    this.arbitrageService.getArbitragesEnAttente().subscribe({
      next: (data) => {
        this.arbitragesEnAttente = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement arbitrages en attente:', error);
        this.error = 'Erreur lors du chargement des arbitrages';
        this.isLoading = false;
      }
    });
  }

  refresh(): void {
    this.loadData();
  }

  // Consultation d'un arbitrage
  consulterArbitrage(arbitrage: ArbitrageEnAttente): void {
    console.log('Consultation arbitrage:', arbitrage.id);
    
    this.selectedArbitrage = arbitrage;
    this.showDetailsModal = true;
    this.activeTab = 'resume';
    this.loadDossierComplet(arbitrage.id);
    this.initializeDecisionForm(arbitrage);
  }

  private loadDossierComplet(arbitrageId: number): void {
    this.isLoadingDetails = true;
    this.dossierComplet = null;
    
    this.arbitrageService.getDossierComplet(arbitrageId).subscribe({
      next: (dossier) => {
        this.dossierComplet = dossier;
        this.isLoadingDetails = false;
        console.log('Dossier complet chargé:', dossier);
      },
      error: (error) => {
        console.error('Erreur chargement dossier:', error);
        this.notificationService.showError('Erreur lors du chargement du dossier complet');
        this.isLoadingDetails = false;
      }
    });
  }

  private initializeDecisionForm(arbitrage: ArbitrageEnAttente): void {
    this.decisionForm = {
      decision: 'FAVORABLE_EMETTEUR',
      motifsDecision: '',
      repartitionFrais: 'PERDANT',
      montantAccorde: arbitrage.montantConteste,
      delaiExecution: 30,
      commentairesSupplementaires: ''
    };
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedArbitrage = null;
    this.dossierComplet = null;
    this.activeTab = 'resume';
    this.resetDecisionForm();
  }

  setActiveTab(tab: 'resume' | 'historique' | 'justificatifs' | 'decision'): void {
    this.activeTab = tab;
  }

  // Gestion de la décision
  onDecisionChange(): void {
    if (!this.selectedArbitrage) return;
    
    switch (this.decisionForm.decision) {
      case 'FAVORABLE_EMETTEUR':
        this.decisionForm.montantAccorde = this.selectedArbitrage.montantConteste;
        this.decisionForm.repartitionFrais = 'DEFENDEUR';
        break;
      case 'FAVORABLE_ACQUIREUR':
        this.decisionForm.montantAccorde = 0;
        this.decisionForm.repartitionFrais = 'DEMANDEUR';
        break;
      case 'PARTAGE':
        this.decisionForm.montantAccorde = Math.round(this.selectedArbitrage.montantConteste / 2);
        this.decisionForm.repartitionFrais = 'PARTAGE';
        break;
      case 'REJET':
        this.decisionForm.montantAccorde = 0;
        this.decisionForm.repartitionFrais = 'DEMANDEUR';
        break;
    }
  }

  isDecisionFormValid(): boolean {
    return !!(
      this.decisionForm.decision &&
      this.decisionForm.motifsDecision &&
      this.decisionForm.motifsDecision.trim().length >= 50 &&
      this.decisionForm.repartitionFrais &&
      (this.decisionForm.decision === 'REJET' || this.decisionForm.montantAccorde !== undefined)
    );
  }

  openConfirmDecisionModal(): void {
    if (!this.isDecisionFormValid()) {
      this.notificationService.showError('Veuillez remplir tous les champs obligatoires (motifs minimum 50 caractères)');
      return;
    }
    this.showConfirmDecisionModal = true;
  }

  closeConfirmDecisionModal(): void {
    this.showConfirmDecisionModal = false;
  }

  confirmerDecision(): void {
    if (!this.selectedArbitrage || !this.isDecisionFormValid()) {
      this.notificationService.showError('Formulaire invalide');
      return;
    }

    this.isProcessingDecision = true;
    
    this.arbitrageService.rendreDecision(this.selectedArbitrage.id, this.decisionForm).subscribe({
      next: (result) => {
        console.log('Décision rendue:', result);
        this.notificationService.showSuccess('Décision d\'arbitrage rendue avec succès');
        
        // Retirer l'arbitrage de la liste
        this.arbitragesEnAttente = this.arbitragesEnAttente.filter(
          arb => arb.id !== this.selectedArbitrage!.id
        );
        
        // Fermer les modals
        this.closeConfirmDecisionModal();
        this.closeDetailsModal();
        
        // Recharger le dashboard
        this.loadData();
        
        this.isProcessingDecision = false;
      },
      error: (error) => {
        console.error('Erreur rendu décision:', error);
        this.notificationService.showError('Erreur lors du rendu de la décision');
        this.isProcessingDecision = false;
      }
    });
  }

  private resetDecisionForm(): void {
    this.decisionForm = {
      decision: 'FAVORABLE_EMETTEUR',
      motifsDecision: '',
      repartitionFrais: 'PERDANT',
      montantAccorde: undefined,
      delaiExecution: 30,
      commentairesSupplementaires: ''
    };
  }

  // Télécharger un justificatif
  downloadJustificatif(justificatif: any): void {
    // TODO: Implémenter le téléchargement
    console.log('Téléchargement justificatif:', justificatif.nom);
    this.notificationService.showInfo('Téléchargement de ' + justificatif.nom);
  }

  // Utilitaires de formatage
  getUrgenceClass(urgence: string): string {
    switch (urgence) {
      case 'CRITIQUE': return 'urgence-critique';
      case 'HAUTE': return 'urgence-haute';
      case 'MOYENNE': return 'urgence-moyenne';
      default: return 'urgence-normale';
    }
  }

  formatMontant(montant: number | undefined): string {
    if (!montant && montant !== 0) return '0,00 MAD';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(montant);
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleString('fr-FR');
    } catch {
      return date;
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'CHARGEBACK_INITIAL': return '#3498db';
      case 'REPRESENTATION': return '#f39c12';
      case 'PRE_ARBITRAGE': return '#e67e22';
      case 'ARBITRAGE': return '#e74c3c';
      case 'FINALISE': return '#27ae60';
      default: return '#95a5a6';
    }
  }

  getDecisionLabel(decision: string): string {
    switch (decision) {
      case 'FAVORABLE_EMETTEUR': return 'Favorable à la banque émettrice';
      case 'FAVORABLE_ACQUIREUR': return 'Favorable à la banque acquéreuse';
      case 'PARTAGE': return 'Partage de responsabilité';
      case 'REJET': return 'Rejet de la demande';
      default: return decision;
    }
  }

  getRepartitionLabel(repartition: string): string {
    switch (repartition) {
      case 'DEMANDEUR': return 'À la charge du demandeur';
      case 'DEFENDEUR': return 'À la charge du défendeur';
      case 'PARTAGE': return 'Partagés équitablement';
      case 'PERDANT': return 'À la charge de la partie perdante';
      default: return repartition;
    }
  }

  // Track by functions pour optimiser le rendering
  trackByHistorique(index: number, item: any): number {
    return item.id;
  }

  trackByJustificatif(index: number, item: any): number {
    return item.id;
  }
}