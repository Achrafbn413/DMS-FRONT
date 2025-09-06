import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Interfaces compatibles avec le backend
export interface ArbitrageDashboard {
  totalArbitrages: number;
  arbitragesEnAttente: number;
  arbitragesEnCours: number;
  arbitragesDecides: number;
  arbitragesUrgents: number;
  montantTotalEnJeu: number;
  delaiMoyenDecision: number;
  tauxTraitement: number;
  alertes: string[];
}

export interface ArbitrageEnAttente {
  id: number;
  litigeId: number;
  dateDemande: string;
  joursAttente: number;
  urgence: string;
  montantConteste: number;
  transactionReference: string;
  banqueEmettrice: string;
  banqueAcquereuse: string;
  motifChargeback: string;
}

// Interface pour le dossier complet (compatible backend)
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
  banques: {
    emettrice: { id: number; nom: string; };
    acquereuse: { id: number; nom: string; };
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

@Injectable({
  providedIn: 'root'
})
export class ArbitrageAdminService {
  private readonly API_URL = 'http://localhost:8080/api/admin/arbitrage';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Récupérer le dashboard des arbitrages
   */
  getDashboardArbitrage(): Observable<ArbitrageDashboard> {
    return this.http.get<ArbitrageDashboard>(`${this.API_URL}/dashboard`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Récupérer les arbitrages en attente de décision
   */
  getArbitragesEnAttente(): Observable<ArbitrageEnAttente[]> {
    return this.http.get<ArbitrageEnAttente[]>(`${this.API_URL}/en-attente`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Récupérer le dossier complet d'un arbitrage
   */
  getDossierComplet(arbitrageId: number): Observable<DossierArbitrageComplet> {
    return this.http.get<DossierArbitrageComplet>(`${this.API_URL}/${arbitrageId}/dossier-complet`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Rendre une décision d'arbitrage
   * Compatible avec la signature backend : PUT /api/admin/arbitrage/{arbitrageId}/decision
   * avec paramètres URL selon ChargebackWorkflowService.rendreDecisionArbitrage
   */
  rendreDecision(arbitrageId: number, decision: DecisionArbitrageRequest): Observable<any> {
  console.log('🏛️ [ArbitrageAdminService] Rendu décision:', { arbitrageId, decision });
  
  // CORRECTION: POST + body JSON (pas URL params)
  const requestBody = {
    decision: decision.decision,
    motifsDecision: decision.motifsDecision,  // Nom correct
    repartitionFrais: decision.repartitionFrais,
    montantAccorde: decision.montantAccorde,
    delaiExecution: decision.delaiExecution,
    commentairesSupplementaires: decision.commentairesSupplementaires
  };
  
  return this.http.post(`${this.API_URL}/${arbitrageId}/decision`, requestBody, {
    headers: this.getHeaders()
  });
}

  /**
   * Méthodes additionnelles pour fonctionnalités étendues
   */

  /**
   * Récupérer les arbitrages par statut
   */
  getArbitragesByStatut(statut: string): Observable<ArbitrageEnAttente[]> {
    const params = new HttpParams().set('statut', statut);
    
    return this.http.get<ArbitrageEnAttente[]>(`${this.API_URL}/par-statut`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Récupérer les arbitrages par institution
   */
  getArbitragesByInstitution(institutionId: number): Observable<ArbitrageEnAttente[]> {
    const params = new HttpParams().set('institutionId', institutionId.toString());
    
    return this.http.get<ArbitrageEnAttente[]>(`${this.API_URL}/par-institution`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Récupérer les arbitrages dans une période donnée
   */
  getArbitragesByPeriode(dateDebut: string, dateFin: string): Observable<ArbitrageEnAttente[]> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    
    return this.http.get<ArbitrageEnAttente[]>(`${this.API_URL}/par-periode`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Récupérer les statistiques détaillées
   */
  getStatistiquesDetaillees(): Observable<any> {
    return this.http.get(`${this.API_URL}/statistiques-detaillees`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Exporter les données d'arbitrage
   */
  exporterArbitrages(format: 'csv' | 'excel', filtres?: any): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        if (filtres[key]) {
          params = params.set(key, filtres[key]);
        }
      });
    }
    
    return this.http.get(`${this.API_URL}/export`, {
      headers: this.getHeaders(),
      params: params,
      responseType: 'blob'
    });
  }

  /**
   * Télécharger un justificatif
   */
  downloadJustificatif(justificatifId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/justificatifs/${justificatifId}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Rechercher dans les arbitrages
   */
  rechercherArbitrages(terme: string, filtres?: any): Observable<ArbitrageEnAttente[]> {
    let params = new HttpParams().set('terme', terme);
    
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        if (filtres[key]) {
          params = params.set(key, filtres[key]);
        }
      });
    }
    
    return this.http.get<ArbitrageEnAttente[]>(`${this.API_URL}/rechercher`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Méthodes utilitaires
   */

  /**
   * Valider les données de décision avant envoi
   */
  validerDecision(decision: DecisionArbitrageRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!decision.decision) {
      errors.push('La décision est obligatoire');
    }
    
    if (!decision.motifsDecision || decision.motifsDecision.trim().length < 50) {
      errors.push('Les motifs de la décision sont obligatoires (minimum 50 caractères)');
    }
    
    if (!decision.repartitionFrais) {
      errors.push('La répartition des frais est obligatoire');
    }
    
    if (decision.decision !== 'REJET' && !decision.montantAccorde && decision.montantAccorde !== 0) {
      errors.push('Le montant accordé est obligatoire pour cette décision');
    }
    
    if (decision.delaiExecution && (decision.delaiExecution < 1 || decision.delaiExecution > 365)) {
      errors.push('Le délai d\'exécution doit être entre 1 et 365 jours');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formater les données pour l'affichage
   */
  formatMontant(montant: number): string {
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

  /**
   * Calculer l'urgence d'un arbitrage
   */
  calculerUrgence(joursAttente: number): string {
    if (joursAttente >= 30) return 'CRITIQUE';
    if (joursAttente >= 21) return 'HAUTE';
    if (joursAttente >= 14) return 'MOYENNE';
    return 'NORMALE';
  }

  /**
   * Obtenir la couleur selon l'urgence
   */
  getCouleurUrgence(urgence: string): string {
    switch (urgence) {
      case 'CRITIQUE': return '#e74c3c';
      case 'HAUTE': return '#e67e22';
      case 'MOYENNE': return '#f39c12';
      default: return '#27ae60';
    }
  }
}