import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  InitiationChargebackRequest,
  RepresentationRequest,
  SecondPresentmentRequest,
  InitiationArbitrageRequest,
  LitigeChargebackDTO,
  ArbitrageDTO,
  StatistiquesChargeback,
  EchangeLitige,
  JustificatifChargeback,
  UploadJustificatifResponse,
   DecisionArbitrageRequest, // ✅ AJOUTÉ
  AnnulationChargebackRequest,
  JustificatifMetadata,
  ChargebackFilters,
  ChargebackActions,
  ChargebackUtils,
  DecisionArbitrage,
  RepartitionFrais
} from '../models/chargeback.model';

@Injectable({
  providedIn: 'root'
})
export class ChargebackService {
  
  private apiUrl = 'http://localhost:8080/api/public/chargebacks';
  private uploadUrl = 'http://localhost:8080/api/upload'; // Adapter selon votre API upload
  
  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  // ===============================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ===============================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Pas de Content-Type pour les uploads multipart
    });
  }

  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`[ChargebackService] Erreur ${operation}:`, error);
      
      let errorMessage = `Erreur lors de ${operation}`;
      
      // Gestion des erreurs spécifiques du backend
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return throwError(() => new Error(errorMessage));
    };
  }

  private getCurrentUser(): any {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      throw new Error('Utilisateur non connecté ou données utilisateur manquantes');
    }
    return user;
  }

  private getInstitutionId(): number {
    const user = this.getCurrentUser();
    const institutionId = user.institution?.id || user.institutionId;
    if (!institutionId) {
      throw new Error('Institution non identifiée');
    }
    return institutionId;
  }

  // ===============================================
  // ACTIONS PRINCIPALES DU WORKFLOW CHARGEBACK
  // ===============================================

  /**
   * ✅ Initier un chargeback (Banque Émettrice)
   * Compatible avec InitiationChargebackRequest backend
   */
 initierChargeback(request: InitiationChargebackRequest): Observable<LitigeChargebackDTO> {
  console.log('🌐 [SERVICE-HTTP] ===== DÉBUT initierChargeback SERVICE =====');
  console.log('🌐 [SERVICE-HTTP] Requête reçue:', request);
  console.log('🌐 [SERVICE-HTTP] API URL de base:', this.apiUrl);
  
  // Validation des données requises
  console.log('🔍 [SERVICE-HTTP] Validation litigeId...');
  if (!request.litigeId) {
    console.log('❌ [SERVICE-HTTP] ÉCHEC: ID du litige manquant');
    return throwError(() => new Error('ID du litige obligatoire'));
  }
  console.log('✅ [SERVICE-HTTP] litigeId valide:', request.litigeId);
  
  console.log('🔍 [SERVICE-HTTP] Validation motif chargeback...');
  console.log('🔍 [SERVICE-HTTP] Motif reçu:', request.motifChargeback);
  console.log('🔍 [SERVICE-HTTP] Longueur motif:', request.motifChargeback?.trim().length);
  
  if (!request.motifChargeback || request.motifChargeback.trim().length < 10) {
    console.log('❌ [SERVICE-HTTP] ÉCHEC: Motif invalide');
    return throwError(() => new Error('Motif du chargeback obligatoire (min 10 caractères)'));
  }
  console.log('✅ [SERVICE-HTTP] Motif valide');
  
  console.log('🔍 [SERVICE-HTTP] Validation montant...');
  console.log('🔍 [SERVICE-HTTP] Montant reçu:', request.montantConteste);
  
  if (!request.montantConteste || request.montantConteste <= 0) {
    console.log('❌ [SERVICE-HTTP] ÉCHEC: Montant invalide');
    return throwError(() => new Error('Montant contesté obligatoire et positif'));
  }
  console.log('✅ [SERVICE-HTTP] Montant valide');

  // Enrichir la requête avec les données utilisateur si manquantes
  console.log('🔧 [SERVICE-HTTP] Enrichissement de la requête...');
  const enrichedRequest = { ...request };
  
  console.log('🔍 [SERVICE-HTTP] Vérification utilisateurEmetteurId...');
  if (!enrichedRequest.utilisateurEmetteurId) {
    const currentUser = this.getCurrentUser();
    enrichedRequest.utilisateurEmetteurId = currentUser.id;
    console.log('🔧 [SERVICE-HTTP] utilisateurEmetteurId ajouté:', currentUser.id);
  } else {
    console.log('✅ [SERVICE-HTTP] utilisateurEmetteurId déjà présent:', enrichedRequest.utilisateurEmetteurId);
  }
  
  console.log('🔍 [SERVICE-HTTP] Vérification banqueEmettriceId...');
  if (!enrichedRequest.banqueEmettriceId) {
    const institutionId = this.getInstitutionId();
    enrichedRequest.banqueEmettriceId = institutionId;
    console.log('🔧 [SERVICE-HTTP] banqueEmettriceId ajouté:', institutionId);
  } else {
    console.log('✅ [SERVICE-HTTP] banqueEmettriceId déjà présent:', enrichedRequest.banqueEmettriceId);
  }
  
  console.log('📤 [SERVICE-HTTP] Requête enrichie finale:', enrichedRequest);
  
  const fullUrl = `${this.apiUrl}/initiate`;
  console.log('🌐 [SERVICE-HTTP] URL complète appel:', fullUrl);
  
  const headers = this.getHeaders();
  console.log('🔐 [SERVICE-HTTP] Headers préparés:', headers);
  
  console.log('🚀 [SERVICE-HTTP] Lancement requête HTTP POST...');
  
  return this.http.post<LitigeChargebackDTO>(fullUrl, enrichedRequest, {
    headers: headers
  }).pipe(
    map((response: LitigeChargebackDTO) => {
      console.log('✅ [SERVICE-HTTP] Réponse HTTP reçue avec succès:', response);
      console.log('✅ [SERVICE-HTTP] ID chargeback créé:', response.id);
      console.log('✅ [SERVICE-HTTP] Phase actuelle:', response.phaseActuelle);
      return response;
    }),
    catchError((error: any) => {
      console.error('❌ [SERVICE-HTTP] ===== GESTION ERREUR =====');
      console.error('❌ [SERVICE-HTTP] Erreur capturée:', error);
      console.error('❌ [SERVICE-HTTP] Status:', error.status);
      console.error('❌ [SERVICE-HTTP] Body:', error.error);
      console.error('❌ [SERVICE-HTTP] Message:', error.message);
      return this.handleError('initiation du chargeback')(error);
    })
  );
}

  /**
   * ✅ Traiter la représentation (Banque Acquéreuse)
   * Compatible avec RepresentationRequest backend
   */
  traiterRepresentation(request: RepresentationRequest): Observable<LitigeChargebackDTO> {
    console.log('🎯 [ChargebackService] Représentation:', request);
    
    // Validation
    if (!request.litigeId) {
      return throwError(() => new Error('ID du litige obligatoire'));
    }
    
    if (!request.typeReponse) {
      return throwError(() => new Error('Type de réponse obligatoire'));
    }
    
    if (!request.reponseDetaillee || request.reponseDetaillee.trim().length < 20) {
      return throwError(() => new Error('Réponse détaillée obligatoire (min 20 caractères)'));
    }

    // Enrichir la requête
    const enrichedRequest = { ...request };
    
    if (!enrichedRequest.utilisateurAcquereurId) {
      enrichedRequest.utilisateurAcquereurId = this.getCurrentUser().id;
    }
    
    if (!enrichedRequest.banqueAcquereuseId) {
      enrichedRequest.banqueAcquereuseId = this.getInstitutionId();
    }
    
    return this.http.post<LitigeChargebackDTO>(`${this.apiUrl}/representation`, enrichedRequest, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('traitement de la représentation'))
    );
  }

  /**
   * ✅ Traiter le second presentment (Banque Émettrice)
   * Compatible avec SecondPresentmentRequest backend
   */
  traiterSecondPresentment(request: SecondPresentmentRequest): Observable<LitigeChargebackDTO> {
    console.log('🎯 [ChargebackService] Second presentment:', request);
    
    // Validation
    if (!request.litigeId) {
      return throwError(() => new Error('ID du litige obligatoire'));
    }
    
    if (!request.motifRejet || request.motifRejet.trim().length < 20) {
      return throwError(() => new Error('Motif de rejet obligatoire (min 20 caractères)'));
    }
    
    if (!request.refutationDetaillee || request.refutationDetaillee.trim().length < 50) {
      return throwError(() => new Error('Réfutation détaillée obligatoire (min 50 caractères)'));
    }

    // Enrichir la requête
    const enrichedRequest = { ...request };
    
    if (!enrichedRequest.utilisateurEmetteurId) {
      enrichedRequest.utilisateurEmetteurId = this.getCurrentUser().id;
    }
    
    if (!enrichedRequest.banqueEmettriceId) {
      enrichedRequest.banqueEmettriceId = this.getInstitutionId();
    }
    
    return this.http.post<LitigeChargebackDTO>(`${this.apiUrl}/second-presentment`, enrichedRequest, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('second presentment'))
    );
  }

  /**
   * ✅ Demander un arbitrage (Banque Émettrice)
   * Compatible avec InitiationArbitrageRequest backend
   */
  demanderArbitrage(request: InitiationArbitrageRequest): Observable<ArbitrageDTO> {
    console.log('🎯 [ChargebackService] Demande arbitrage:', request);
    
    // Validation
    if (!request.litigeId) {
      return throwError(() => new Error('ID du litige obligatoire'));
    }
    
    if (!request.justificationDemande || request.justificationDemande.trim().length < 50) {
      return throwError(() => new Error('Justification de la demande obligatoire (min 50 caractères)'));
    }
    
    if (!request.positionBanque || request.positionBanque.trim().length < 30) {
      return throwError(() => new Error('Position de la banque obligatoire (min 30 caractères)'));
    }

    // Enrichir la requête
    const enrichedRequest = { ...request };
    
    if (!enrichedRequest.utilisateurDemandeurId) {
      enrichedRequest.utilisateurDemandeurId = this.getCurrentUser().id;
    }
    
    if (!enrichedRequest.banqueDemandeuse) {
      enrichedRequest.banqueDemandeuse = this.getInstitutionId();
    }
    
    return this.http.post<ArbitrageDTO>(`${this.apiUrl}/arbitrage`, enrichedRequest, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('demande d\'arbitrage'))
    );
  }

  /**
   * ✅ Rendre une décision d'arbitrage (Admin)
   * Compatible avec l'API backend
   */
  rendreDecisionArbitrage(
    arbitrageId: number, 
    decision: DecisionArbitrage,
    motifs: string,
    repartitionFrais: RepartitionFrais,
    adminId: number
  ): Observable<ArbitrageDTO> {
    console.log('🎯 [ChargebackService] Décision arbitrage:', {
      arbitrageId, decision, motifs, repartitionFrais, adminId
    });

    if (!motifs || motifs.trim().length < 20) {
      return throwError(() => new Error('Motifs de décision obligatoires (min 20 caractères)'));
    }

    const params = new HttpParams()
      .set('decision', decision)
      .set('motifs', motifs)
      .set('repartitionFrais', repartitionFrais)
      .set('adminId', adminId.toString());
    
    return this.http.put<ArbitrageDTO>(`${this.apiUrl}/arbitrage/${arbitrageId}/decision`, {}, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(this.handleError('rendu de décision d\'arbitrage'))
    );
  }

  /**
   * ✅ Annuler un chargeback
   */
  annulerChargeback(litigeId: number, motifAnnulation: string): Observable<any> {
    console.log('🎯 [ChargebackService] Annulation chargeback:', { litigeId, motifAnnulation });

    if (!motifAnnulation || motifAnnulation.trim().length < 10) {
      return throwError(() => new Error('Motif d\'annulation obligatoire (min 10 caractères)'));
    }

    const params = new HttpParams()
      .set('utilisateurId', this.getCurrentUser().id.toString())
      .set('motif', motifAnnulation);
    
    return this.http.put(`${this.apiUrl}/${litigeId}/cancel`, {}, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(this.handleError('annulation du chargeback'))
    );
  }

  // ===============================================
  // CONSULTATION ET STATISTIQUES
  // ===============================================

  /**
   * ✅ Récupérer les chargebacks par institution
   */
  getChargebacksByInstitution(institutionId?: number): Observable<LitigeChargebackDTO[]> {
    const targetInstitutionId = institutionId || this.getInstitutionId();
    console.log('📊 [ChargebackService] Chargebacks par institution:', targetInstitutionId);
    
    return this.http.get<LitigeChargebackDTO[]>(`${this.apiUrl}/institution/${targetInstitutionId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('récupération des chargebacks par institution'))
    );
  }

  /**
   * ✅ Récupérer les chargebacks par phase
   */
  getChargebacksByPhase(phase: string): Observable<LitigeChargebackDTO[]> {
    console.log('📊 [ChargebackService] Chargebacks par phase:', phase);
    
    return this.http.get<LitigeChargebackDTO[]>(`${this.apiUrl}/phase/${phase}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('récupération des chargebacks par phase'))
    );
  }

  /**
   * ✅ Récupérer les chargebacks urgents
   */
  getChargebacksUrgents(): Observable<LitigeChargebackDTO[]> {
    console.log('🚨 [ChargebackService] Chargebacks urgents');
    
    return this.http.get<LitigeChargebackDTO[]>(`${this.apiUrl}/urgent`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('récupération des chargebacks urgents'))
    );
  }

  /**
   * ✅ Récupérer les statistiques de chargeback pour une institution
   */
  getStatistiquesChargeback(institutionId?: number): Observable<StatistiquesChargeback> {
    const targetInstitutionId = institutionId || this.getInstitutionId();
    console.log('📊 [ChargebackService] Statistiques pour institution:', targetInstitutionId);
    
    return this.http.get<StatistiquesChargeback>(`${this.apiUrl}/stats/${targetInstitutionId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('récupération des statistiques'))
    );
  }

  /**
   * ✅ Récupérer l'historique complet d'un litige
   */
  getHistoriqueComplet(litigeId: number): Observable<EchangeLitige[]> {
    console.log('📋 [ChargebackService] Historique complet:', litigeId);
    
    return this.http.get<EchangeLitige[]>(`${this.apiUrl}/history/${litigeId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError('récupération de l\'historique'))
    );
  }

  /**
   * ✅ Récupérer les détails complets d'un chargeback
   * Note: Cette méthode peut nécessiter l'ajout d'un endpoint backend
   */
  getChargebackDetails(litigeId: number): Observable<LitigeChargebackDTO | undefined> {
    console.log('🔍 [ChargebackService] Détails chargeback:', litigeId);
    
    // Pour l'instant, on utilise l'endpoint par institution et on filtre
    return this.getChargebacksByInstitution().pipe(
      map((chargebacks: LitigeChargebackDTO[]) => 
        chargebacks.find(cb => cb.litigeId === litigeId)
      ),
      catchError(this.handleError('récupération des détails du chargeback'))
    );
  }

  // ===============================================
  // GESTION DES JUSTIFICATIFS
  // ===============================================

  /**
   * ✅ Uploader un justificatif
   * Adapté à votre infrastructure d'upload
   */
  uploadJustificatif(file: File, metadata: JustificatifMetadata): Observable<UploadJustificatifResponse> {
    console.log('📤 [ChargebackService] Upload justificatif:', { 
      fileName: file.name, 
      metadata 
    });

    // Validation de fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return throwError(() => new Error(`Fichier trop volumineux (max 10MB): ${file.name}`));
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return throwError(() => new Error(`Type de fichier non autorisé: ${file.type}`));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('phase', metadata.phase);
    formData.append('type', metadata.type);
    formData.append('litigeId', metadata.litigeId.toString());

    return this.http.post<UploadJustificatifResponse>(`${this.uploadUrl}/justificatif`, formData, {
      headers: this.getUploadHeaders()
    }).pipe(
      catchError(this.handleError('upload du justificatif'))
    );
  }

  /**
   * ✅ Upload multiple de justificatifs
   */
  uploadMultipleJustificatifs(files: File[], metadata: JustificatifMetadata): Observable<UploadJustificatifResponse[]> {
    console.log('📤 [ChargebackService] Upload multiple justificatifs:', files.length);
    
    const uploads: Observable<UploadJustificatifResponse>[] = files.map(file => 
      this.uploadJustificatif(file, metadata)
    );
    
    // Attendre que tous les uploads soient terminés
    return new Observable(observer => {
      const results: UploadJustificatifResponse[] = [];
      let completed = 0;
      
      uploads.forEach((upload, index) => {
        upload.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;
            
            if (completed === uploads.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }

  // ===============================================
  // MÉTHODES UTILITAIRES POUR L'UI
  // ===============================================

  /**
   * ✅ Vérifier les autorisations selon le rôle et la phase
   */
  checkPermissions(userRole: string, institutionId: number, chargeback: LitigeChargebackDTO): ChargebackActions {
    const transaction = chargeback.transaction;
    const isEmettrice = transaction?.banqueEmettrice?.id === institutionId;
    const isAcquereuse = transaction?.banqueAcquereuse?.id === institutionId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'CENTRE';
    const phase = chargeback.phaseActuelle;

    return {
      canInitier: !!isEmettrice && !chargeback.id,
      canRepresenter: !!isAcquereuse && phase === 'CHARGEBACK_INITIAL',
      canSecondPresentment: !!isEmettrice && phase === 'REPRESENTATION',
      canDemanderArbitrage: !!isEmettrice && 
        ['REPRESENTATION', 'PRE_ARBITRAGE'].includes(phase || '') && 
        !!chargeback.peutEtreEscalade,
      canDeciderArbitrage: !!isAdmin && phase === 'ARBITRAGE',
      canAnnuler: (!!isEmettrice || !!isAcquereuse) && 
        !['ARBITRAGE', 'FINALISE'].includes(phase || ''),
      isEmettrice: !!isEmettrice,
      isAcquereuse: !!isAcquereuse,
      isAdmin: !!isAdmin
    };
  }

  /**
   * ✅ Filtrer les chargebacks selon les critères
   */
  filterChargebacks(chargebacks: LitigeChargebackDTO[], filters: ChargebackFilters): LitigeChargebackDTO[] {
    return chargebacks.filter(chargeback => {
      // Filtre par phase
      if (filters.phase && chargeback.phaseActuelle !== filters.phase) {
        return false;
      }
      
      // Filtre urgent
      if (filters.urgent && !ChargebackUtils.isPhaseUrgente(chargeback.deadlineActuelle || '', chargeback.phaseActuelle || '')) {
        return false;
      }
      
      // Filtre par dates
      if (filters.dateDebut && chargeback.dateCreation) {
        const dateCreation = new Date(chargeback.dateCreation);
        const dateDebut = new Date(filters.dateDebut);
        if (dateCreation < dateDebut) {
          return false;
        }
      }
      
      if (filters.dateFin && chargeback.dateCreation) {
        const dateCreation = new Date(chargeback.dateCreation);
        const dateFin = new Date(filters.dateFin);
        if (dateCreation > dateFin) {
          return false;
        }
      }
      
      // Filtre par texte de recherche
      if (filters.texteRecherche) {
        const searchTerm = filters.texteRecherche.toLowerCase();
        const searchFields = [
          chargeback.motifChargeback,
          chargeback.transaction?.reference,
          chargeback.litige?.description
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }
      
      // Filtre par institution
      if (filters.institutionId) {
        const isRelated = chargeback.transaction?.banqueEmettrice?.id === filters.institutionId ||
                         chargeback.transaction?.banqueAcquereuse?.id === filters.institutionId;
        if (!isRelated) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * ✅ Trier les chargebacks
   */
  sortChargebacks(chargebacks: LitigeChargebackDTO[], sortBy: string, sortDirection: 'asc' | 'desc' = 'desc'): LitigeChargebackDTO[] {
    return [...chargebacks].sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'dateCreation':
          valueA = new Date(a.dateCreation || 0);
          valueB = new Date(b.dateCreation || 0);
          break;
        case 'deadline':
          valueA = new Date(a.deadlineActuelle || 0);
          valueB = new Date(b.deadlineActuelle || 0);
          break;
        case 'montant':
          valueA = a.montantConteste || 0;
          valueB = b.montantConteste || 0;
          break;
        case 'phase':
          valueA = a.phaseActuelle || '';
          valueB = b.phaseActuelle || '';
          break;
        case 'reference':
          valueA = a.transaction?.reference || '';
          valueB = b.transaction?.reference || '';
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * ✅ Obtenir un résumé des chargebacks
   */
  getChargebackSummary(chargebacks: LitigeChargebackDTO[]): any {
    const summary = {
      total: chargebacks.length,
      parPhase: {} as any,
      montantTotal: 0,
      urgents: 0,
      enRetard: 0
    };

    chargebacks.forEach(chargeback => {
      // Comptage par phase
      const phase = chargeback.phaseActuelle || 'INCONNUE';
      summary.parPhase[phase] = (summary.parPhase[phase] || 0) + 1;
      
      // Montant total
      if (chargeback.montantConteste) {
        summary.montantTotal += chargeback.montantConteste;
      }
      
      // Urgents
      if (ChargebackUtils.isPhaseUrgente(chargeback.deadlineActuelle || '', phase)) {
        summary.urgents++;
      }
      
      // En retard
      if (chargeback.deadlineActuelle && new Date(chargeback.deadlineActuelle) < new Date()) {
        summary.enRetard++;
      }
    });

    return summary;
  }

  /**
   * ✅ Valider une requête avant envoi
   */
  validateChargebackRequest(type: string, data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case 'initiation':
        if (!data.litigeId) errors.push('ID du litige obligatoire');
        if (!data.motifChargeback || data.motifChargeback.length < 10) {
          errors.push('Motif du chargeback obligatoire (min 10 caractères)');
        }
        if (!data.montantConteste || data.montantConteste <= 0) {
          errors.push('Montant contesté obligatoire et positif');
        }
        break;
        
      case 'representation':
        if (!data.litigeId) errors.push('ID du litige obligatoire');
        if (!data.typeReponse) errors.push('Type de réponse obligatoire');
        if (!data.reponseDetaillee || data.reponseDetaillee.length < 20) {
          errors.push('Réponse détaillée obligatoire (min 20 caractères)');
        }
        break;
        
      case 'secondPresentment':
        if (!data.litigeId) errors.push('ID du litige obligatoire');
        if (!data.motifRejet || data.motifRejet.length < 20) {
          errors.push('Motif de rejet obligatoire (min 20 caractères)');
        }
        if (!data.refutationDetaillee || data.refutationDetaillee.length < 50) {
          errors.push('Réfutation détaillée obligatoire (min 50 caractères)');
        }
        break;
        
      case 'arbitrage':
        if (!data.litigeId) errors.push('ID du litige obligatoire');
        if (!data.justificationDemande || data.justificationDemande.length < 50) {
          errors.push('Justification obligatoire (min 50 caractères)');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===============================================
  // MÉTHODES UTILITAIRES GÉNÉRALES
  // ===============================================

  /**
   * ✅ Formater un montant en devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * ✅ Formater une date
   */
  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  }

  /**
   * ✅ Formater une date avec heure
   */
  formatDateTime(date: string): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleString('fr-FR');
    } catch {
      return date;
    }
  }

  /**
   * ✅ Obtenir le libellé français d'une phase
   */
  getPhaseLabel(phase: string): string {
    return ChargebackUtils.getPhaseLabel(phase);
  }

  /**
   * ✅ Obtenir la couleur d'une phase
   */
  getPhaseColor(phase: string): string {
    return ChargebackUtils.getPhaseColor(phase);
  }

  /**
   * ✅ Calculer les jours restants
   */
  calculerJoursRestants(deadline: string): number {
    return ChargebackUtils.calculerJoursRestants(deadline);
  }

  /**
   * ✅ Vérifier si un chargeback est urgent
   */
  isChargebackUrgent(deadline: string, phase: string): boolean {
    return ChargebackUtils.isPhaseUrgente(deadline, phase);
  }

  /**
   * ✅ Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    return ChargebackUtils.formatFileSize(bytes);
  }


  // ✅ AJOUTEZ cette méthode dans ChargebackService.ts
deciderArbitrage(chargebackId: number, request: DecisionArbitrageRequest): Observable<any> {
  const url = 'http://localhost:8080/api/chargebacks/' + chargebackId + '/decision-arbitrage';
  return this.http.post<any>(url, request);
}

/**
 * Obtenir les en-têtes HTTP avec token d'authentification
 */


/**
 * Récupérer l'historique des échanges d'un chargeback
 */
getHistoriqueChargeback(litigeId: number): Observable<EchangeLitige[]> {
  console.log('📋 [ChargebackService] Récupération historique pour litige:', litigeId);
  
  if (!litigeId || litigeId <= 0) {
    return throwError(() => new Error('ID du litige invalide'));
  }

  const url = `http://localhost:8080/api/chargebacks/${litigeId}/historique`;
  
  return this.http.get<EchangeLitige[]>(url, {
    headers: this.getHeaders()
  }).pipe(
    catchError((error: any) => {
      console.error('❌ Erreur récupération historique:', error);
      return throwError(() => error);
    })
  );
}
}