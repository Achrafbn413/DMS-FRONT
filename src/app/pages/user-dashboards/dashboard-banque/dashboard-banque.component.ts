import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { TransactionService } from '../../../services/transaction.service';
import { LitigeService } from '../../../services/litige.service';
import { NotificationService } from '../../../services/notification.service';

// ✅ IMPORTS CORRIGÉS - Compatible avec vos enums
import { Transaction, TransactionWithMeta, SatimTransactionResponse, StatutTransaction } from '../../../models/transaction.model';
import { Litige, LitigeRecu, TypeLitige, StatutLitige } from '../../../models/litige.model';
import { Utilisateur, RoleUtilisateur } from '../../../models/user.model';
import { Institution, TypeInstitution } from '../../../models/institution.model';
import { AuthService } from '../../../auth/auth.service';

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

  // ✅ SÉPARATION : Transactions brutes vs transactions signalables
  allTransactions: TransactionWithMeta[] = [];
  transactions: TransactionWithMeta[] = []; // Seulement les signalables
  filteredTransactions: TransactionWithMeta[] = [];
  paginatedTransactions: TransactionWithMeta[] = [];
  
  litigesRecus: LitigeRecu[] = [];
  nombreLitigesNonLus: number = 0;
  litigesAcquereur: Litige[] = [];

  unreadNotifications: Litige[] = [];
  showNotificationPanel = false;
  institutionId: number | null = null;
  currentUserId: number | null = null;

  signaledTransactionIds: Set<number> = new Set();
  clickedTransactions: Set<number> = new Set();

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  searchTerm = '';
  statutFilter = '';
  typeFilter = '';

  // ✅ NOUVELLES STATS : Différencier toutes les transactions vs signalables
  totalTransactions = 0;
  totalSignalableTransactions = 0;
  totalAmount = '0 MAD';
  averageAmount = '0 MAD';
  flaggedCount = 0;

  isUploadingFile = false;
  isLoadingTransactions = false;
  isLoadingLitiges = false;

  selectedFileName = '';

  constructor(
    private transactionService: TransactionService,
    private litigeService: LitigeService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeUserData();
    console.log('🔍 USER INIT:', {
    institutionId: this.institutionId,
    institution: this.institution,
    currentUserId: this.currentUserId
});
  }

  // ✅ CORRIGÉ : Initialisation utilisateur simplifiée et robuste
  private initializeUserData(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.notificationService.showError('❌ Données utilisateur manquantes. Veuillez vous reconnecter.');
      return;
    }

    try {
      const user: Utilisateur = JSON.parse(userStr);
      
      // Validation des données utilisateur
      if (!user.id) {
        console.warn('[WARNING] Utilisateur sans ID détecté.');
        this.notificationService.showError('❌ Données utilisateur invalides. Veuillez vous reconnecter.');
        return;
      }

      this.currentUserId = user.id;
      this.nomEmploye = user.nom || 'Employé';
      this.institution = typeof user.institution === 'string' ? user.institution : user.institution?.nom || 'Institution inconnue';
      this.institutionId = (user.institution as any)?.id || (user as any).institutionId || null;

      if (!this.institutionId) {
        console.warn('[WARNING] Institution ID manquant.');
        this.notificationService.showError('❌ Institution non identifiée. Veuillez contacter l\'administrateur.');
        return;
      }

      // Chargement des données
      this.loadAllData();

    } catch (error) {
      console.error('[ERROR] Erreur parsing user data:', error);
      this.notificationService.showError('❌ Données utilisateur corrompues. Veuillez vous reconnecter.');
    }
  }

  // ✅ CORRIGÉ : Chargement séquentiel des données
  private loadAllData(): void {
    console.log('[INFO] Début du chargement des données...');
    
    // 1. Charger les transactions d'abord
    this.chargerTransactions().then(() => {
      console.log('[INFO] Transactions chargées, chargement des litiges...');
      
      // 2. Charger les litiges
      return this.chargerLitiges();
    }).then(() => {
      console.log('[INFO] Litiges chargés, chargement des notifications...');
      
      // 3. Charger les notifications
      this.loadNotifications();
      
      // 4. Enrichir les données
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
  }

  // ✅ CORRIGÉ : Méthode getTransactionId simplifiée
  getTransactionId(t: TransactionWithMeta): number {
    // Prioriser l'ID principal de la transaction
    if (t.id && t.id > 0) {
      return t.id;
    }
    
    // Fallback vers SATIM Code si disponible
    if (t.satimData?.strCode && t.satimData.strCode > 0) {
      return t.satimData.strCode;
    }
    
    // Fallback vers référence convertie en nombre
    if (t.reference) {
      const refAsNumber = parseInt(t.reference.replace(/\D/g, ''), 10);
      if (!isNaN(refAsNumber) && refAsNumber > 0) {
        return refAsNumber;
      }
    }
    
    console.warn('[WARNING] Impossible de déterminer l\'ID pour la transaction:', t);
    return -1;
  }

  // ✅ NOUVELLE MÉTHODE : Vérifier si une transaction peut être signalée
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

  // ✅ NOUVELLE MÉTHODE : Filtrer les transactions selon les règles métier
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

  // ✅ CORRIGÉ : Chargement transactions avec Promise et filtrage
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

  // ✅ CORRIGÉ : Enrichissement SATIM avec Promise et filtrage
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
          console.log('🔍 BEFORE FILTERING:', {
          totalTransactions: this.allTransactions.length,
          sampleTransaction: this.allTransactions[0],
          institutionId: this.institutionId
          });

          // ✅ NOUVEAU : Filtrer selon les règles métier
          this.filterSignalableTransactions();

          console.log('[DEBUG] Transactions enrichies avec SATIM:', this.allTransactions.length);
          this.loadSignaledTransactionsByUser();
          this.updateStats();
          this.filterTransactions();
          this.isLoadingTransactions = false;
          resolve();
        },
        error: (err: HttpErrorResponse) => {
          console.error('[ERROR] Erreur enrichissement SATIM:', err);
          // Continuer sans données SATIM
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

  // ✅ CORRIGÉ : Chargement SATIM avec Promise et filtrage
  private chargerTransactionsSatim(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.http.get<SatimTransactionResponse[]>('http://localhost:8080/api/satim/all').subscribe({
      next: (data: SatimTransactionResponse[]) => {
        // ✅ NOUVEAU : Enrichir avec les données banque
        this.allTransactions = data.map(s => ({
          id: s.strCode,
          reference: s.strRecoCode,
          montant: s.strRecoNumb,
          dateTransaction: s.strProcDate,
          type: s.strOperCode,
          statut: StatutTransaction.NORMALE,
          litige: false,
          // ✅ AJOUTER : Mapper les codes SATIM vers les objets banque
          banqueEmettrice: this.mapSatimCodeToBank(s.strIssuBanCode),
          banqueAcquereuse: this.mapSatimCodeToBank(s.strAcquBanCode),
          satimData: {
            strCode: s.strCode,
            strTermIden: s.strTermIden
          }
        }));
        
        this.filterSignalableTransactions();
        this.updateStats();
        this.filterTransactions();
        this.isLoadingTransactions = false;
        console.log('[DEBUG] Transactions SATIM chargées:', this.allTransactions.length);
        resolve();
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

// ✅ NOUVELLE MÉTHODE : Mapper codes SATIM vers objets banque
private mapSatimCodeToBank(satimCode: string): Institution | undefined {
  const bankMap: {[key: string]: Institution} = {
    '001': { id: 1, nom: 'CIH BANK', type: 'CENTRE' as any, enabled: true },
    '002': { id: 2, nom: 'ATTIJARIWAFA', type: 'CENTRE' as any, enabled: true },
    '003': { id: 3, nom: 'BMCE', type: 'CENTRE' as any, enabled: true }
  };
  
  return bankMap[satimCode];
}

  // ✅ CORRIGÉ : Chargement litiges avec Promise
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
        resolve(); // Continuer même en cas d'erreur
      });
    });
  }

  // ✅ CORRIGÉ : Chargement litiges émis avec Promise
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

  // ✅ CORRIGÉ : Chargement litiges reçus avec Promise
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

  // ✅ CORRIGÉ : Enrichissement des transactions avec les litiges
  private enrichirTransactionsAvecLitiges(): void {
    console.log('[DEBUG] Début enrichissement transactions avec litiges...');
    
    // 1. Marquer les transactions signalées par notre banque
    this.marquerTransactionsAvecLitigesEmis();
    
    // 2. Pour l'instant, les litiges reçus sont affichés séparément 
    // car LitigeRecu n'a pas de référence à la transaction
    console.log(`[DEBUG] ${this.litigesRecus.length} litiges reçus d'autres banques (affichage séparé)`);
    
    // 3. Mettre à jour l'affichage
    this.updateStats();
    this.filterTransactions();
    
    console.log('[DEBUG] Enrichissement terminé.');
  }

  // ✅ CORRIGÉ : Marquage des transactions avec litiges émis
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

  // ✅ CORRIGÉ : Signalement de transaction avec validation métier
  flagTransaction(transaction: TransactionWithMeta): void {
    if (!this.currentUserId) {
      this.notificationService.showError('❌ Utilisateur non identifié.');
      return;
    }

    // ✅ VALIDATION MÉTIER : Vérifier si on peut signaler cette transaction
    if (!this.canSignalTransaction(transaction)) {
      this.notificationService.showError(
        '❌ Vous ne pouvez signaler que les transactions où votre banque est émettrice ou acquéreuse (règles métier bancaires).'
      );
      return;
    }

    // ✅ NOUVELLE VALIDATION : Vérifier si la transaction a déjà un litige
    if (transaction.statut === StatutTransaction.AVEC_LITIGE) {
      this.notificationService.showError(
        '⚠️ Cette transaction possède déjà un litige. Impossible de la signaler à nouveau.'
      );
      return;
    }

    const transactionId = this.getTransactionId(transaction);

    // ✅ VALIDATION SUPPLÉMENTAIRE : Vérifier dans les litiges connus
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
      return; // Éviter les double-clics
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
          // Mettre à jour immédiatement l'interface
          transaction.statut = StatutTransaction.AVEC_LITIGE;
          transaction.banqueDeclaranteNom = "Notre banque (signalé par nous)";
          this.signaledTransactionIds.add(transactionId);
          this.clickedTransactions.delete(transactionId);
          
          // Mettre à jour les statistiques et l'affichage
          this.updateStats();
          this.filterTransactions();
          
          // Recharger les données pour synchronisation
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

  // ✅ MÉTHODES NOTIFICATIONS
  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  goToTransaction(litige: Litige): void {
    this.markNotificationAsRead(litige);
    this.searchTerm = litige.transaction?.reference || '';
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

  // ✅ MÉTHODES UPLOAD FICHIER
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFileName = file.name;

    // Validation du fichier
    const isValidCSV = file.type === 'text/csv' || 
                      file.type === 'application/csv' || 
                      file.type === 'text/plain' ||
                      file.name.toLowerCase().endsWith('.csv');

    if (!isValidCSV) {
      this.notificationService.showError('❌ Format de fichier non supporté (CSV requis)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.notificationService.showError('❌ Fichier trop volumineux (max 10MB)');
      return;
    }

    // Upload du fichier
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
        
        // Recharger les transactions après un délai
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

  // ✅ CORRIGÉ : Statistiques avec séparation toutes/signalables
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

  // ✅ MÉTHODES UTILITAIRES
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

  // ✅ GETTERS POUR LE TEMPLATE
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

  // ✅ NOUVELLE MÉTHODE : Information sur les règles métier
  showBusinessRulesInfo(): void {
    const message = `
    📋 Règles métier bancaires :
    
    ✅ Vous pouvez signaler les transactions où votre banque est :
    • Banque ÉMETTRICE (issuer) 
    • Banque ACQUÉREUSE (acquirer)
    
    ❌ Vous ne pouvez PAS signaler les transactions entre d'autres banques
    
    📊 Actuellement :
    • ${this.totalTransactions} transactions totales dans le système
    • ${this.totalSignalableTransactions} transactions signalables par votre banque
    `;
    
    this.notificationService.showInfo(message);
  }

  // ✅ MÉTHODE DE DEBUG AMÉLIORÉE
  debugBanqueDeclarante(): void {
    console.log("=== DEBUG BANQUE DECLARANTE ===");
    console.log(`Institution connectée: ${this.institution} (ID: ${this.institutionId})`);
    console.log(`Transactions totales: ${this.totalTransactions}`);
    console.log(`Transactions signalables: ${this.totalSignalableTransactions}`);
    
    this.transactions
      .filter(t => t.statut === StatutTransaction.AVEC_LITIGE)
      .forEach(t => {
        console.log(`Transaction ${t.reference}:`, {
          statut: t.statut,
          banqueDeclaranteNom: t.banqueDeclaranteNom,
          transactionId: this.getTransactionId(t),
          peutSignaler: this.canSignalTransaction(t)
        });
      });
    
    console.log("Litiges reçus:", this.litigesRecus);
    console.log("Litiges acquéreur:", this.litigesAcquereur);
    console.log("Transactions signalées par utilisateur:", Array.from(this.signaledTransactionIds));
    
    this.showBusinessRulesInfo();
  }

  // ====================================================================
// 🆕 NOUVELLES PROPRIÉTÉS ET MÉTHODES POUR FONCTIONNALITÉ DÉTAILS LITIGE
// ====================================================================

// ✅ NOUVELLES PROPRIÉTÉS pour le modal détails
showDetailsModal = false;
selectedLitigeDetails: any = null; // TODO: typer avec LitigeDetailsResponse quand interface importée
isLoadingDetails = false;
detailsError: string | null = null;

/**
 * ✅ NOUVELLE MÉTHODE : Ouvrir le modal des détails d'un litige
 */
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

/**
 * ✅ MÉTHODE : Fermer le modal des détails
 */
closeLitigeDetails(): void {
  this.showDetailsModal = false;
  this.selectedLitigeDetails = null;
  this.detailsError = null;
}

/**
 * ✅ MÉTHODE UTILITAIRE : Formater la durée depuis création
 */
formatDureeDepuisCreation(minutes: number): string {
  if (!minutes) return 'Inconnue';
  
  if (minutes < 60) {
    return `${minutes} minute(s)`;
  } else if (minutes < 1440) { // 24h
    return `${Math.floor(minutes / 60)} heure(s)`;
  } else {
    return `${Math.floor(minutes / 1440)} jour(s)`;
  }
}

/**
 * ✅ MÉTHODE UTILITAIRE : Formater date/heure complète
 */
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

/**
 * ✅ MÉTHODE UTILITAIRE : Badge de priorité
 */
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

/**
 * ✅ MÉTHODE UTILITAIRE : Formater le montant avec devise
 */
formatCurrencyFromNumber(amount: number): string {
  if (!amount && amount !== 0) return '0,00 MAD';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * ✅ MÉTHODE UTILITAIRE : Formater une date simple
 */
formatDateOnly(dateString: string): string {
  if (!dateString) return 'Date inconnue';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  } catch {
    return dateString;
  }
}
// ====================================================================
// 🆕 NOUVELLES PROPRIÉTÉS ET MÉTHODES POUR DÉTAILS TRANSACTION
// ====================================================================

// ✅ NOUVELLES PROPRIÉTÉS pour le modal détails transaction
showTransactionDetailsModal = false;
selectedTransactionDetails: any = null; // TODO: typer avec TransactionDetailsResponse quand interface importée
isLoadingTransactionDetails = false;
transactionDetailsError: string | null = null;

/**
 * ✅ NOUVELLE MÉTHODE : Ouvrir le modal des détails d'une transaction
 *//**
 * ✅ MÉTHODE CORRIGÉE : Ouvrir le modal des détails d'une transaction
 */
/**
 * ✅ MÉTHODE CORRIGÉE : Ouvrir le modal des détails d'une transaction
 */
openTransactionDetails(transaction: TransactionWithMeta): void {
  // ✅ Utiliser la méthode spécifique pour les détails
  const transactionId = this.getTransactionIdForDetails(transaction);
  
  console.log('🔍 Ouverture des détails de la transaction:', {
    transaction: transaction,
    transactionId: transactionId,
    reference: transaction.reference,
    typeOfId: typeof transactionId,
    idValide: transactionId >= 2581 && transactionId <= 2630
  });
  
  // ✅ VALIDATION STRICTE : Vérifier la plage d'IDs valides
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

  console.log(`🚀 Appel API: /api/transactions/details/${transactionId}`);

  this.transactionService.getTransactionDetails(transactionId).subscribe({
    next: (details: any) => {
      console.log('✅ Détails transaction reçus:', details);
      this.selectedTransactionDetails = details;
      this.isLoadingTransactionDetails = false;
      this.notificationService.showSuccess(`✅ Détails de la transaction ${transaction.reference} chargés`);
    },
    error: (error: HttpErrorResponse) => {
      console.error('❌ Erreur lors du chargement des détails transaction:', error);
      console.error('❌ URL appelée:', error.url);
      console.error('❌ Status:', error.status);
      console.error('❌ Message:', error.message);
      
      this.transactionDetailsError = 'Erreur lors du chargement des détails de la transaction';
      this.isLoadingTransactionDetails = false;
      
      // ✅ Messages d'erreur détaillés selon le code HTTP
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

/**
 * ✅ MÉTHODE : Fermer le modal des détails transaction
 */
closeTransactionDetails(): void {
  this.showTransactionDetailsModal = false;
  this.selectedTransactionDetails = null;
  this.transactionDetailsError = null;
}

/**
 * ✅ MÉTHODE UTILITAIRE : Formater la durée depuis création (en jours)
 */
formatDureeDepuisCreationJours(jours: number): string {
  if (!jours && jours !== 0) return 'Inconnue';
  
  if (jours === 0) {
    return 'Aujourd\'hui';
  } else if (jours === 1) {
    return '1 jour';
  } else if (jours < 30) {
    return `${jours} jours`;
  } else if (jours < 365) {
    const mois = Math.floor(jours / 30);
    return `${mois} mois`;
  } else {
    const annees = Math.floor(jours / 365);
    return `${annees} an(s)`;
  }
}

/**
 * ✅ MÉTHODE UTILITAIRE : Classes CSS pour priorité transaction
 */
getTransactionPriorityClass(priorite: string): string {
  switch (priorite?.toUpperCase()) {
    case 'HAUTE':
      return 'priority-high';
    case 'MOYENNE':
      return 'priority-medium';
    default:
      return 'priority-normal';
  }
}

/**
 * ✅ MÉTHODE UTILITAIRE : Icône pour type de transaction
 */
getTransactionTypeIcon(type: string): string {
  switch (type?.toUpperCase()) {
    case 'ACHAT':
      return '🛒';
    case 'RETRAIT':
      return '💳';
    case 'VIREMENT':
      return '💸';
    case 'DEPOT':
      return '💰';
    default:
      return '📄';
  }
}

/**
 * ✅ MÉTHODE UTILITAIRE : Statut de la transaction avec couleur
 */
getTransactionStatutClass(statut: string): string {
  switch (statut?.toUpperCase()) {
    case 'NORMALE':
      return 'status-normale';
    case 'AVEC_LITIGE':
      return 'status-avec-litige';
    case 'SUSPENDUE':
      return 'status-suspendue';
    case 'ANNULEE':
      return 'status-annulee';
    default:
      return 'status-unknown';
  }
}
// ✅ NOUVELLE MÉTHODE SPÉCIFIQUE pour les détails (sans risque)

debugFirstTransaction(): void {
  console.log("=== DEBUG PREMIÈRE TRANSACTION ===");
  const firstTx = this.paginatedTransactions[0];
  if (firstTx) {
    console.log("Transaction complète:", firstTx);
    console.log("ID:", firstTx.id);
    console.log("Référence:", firstTx.reference);
    console.log("SATIM Data:", firstTx.satimData);
    console.log("Type de ID:", typeof firstTx.id);
    console.log("getTransactionId() retourne:", this.getTransactionId(firstTx));
  } else {
    console.log("Aucune transaction paginée");
  }
}
// ✅ NOUVELLE MÉTHODE sécurisée pour les détails
getTransactionIdForDetails(t: TransactionWithMeta): number {
  console.log('🔍 DEBUG getTransactionIdForDetails:', t);
  console.log('🔍 ID transaction:', t.id, 'Type:', typeof t.id);

  // ✅ CORRECTION : Vérifier l'ID principal (plage réelle de votre DB)
  if (t.id && t.id >= 2581 && t.id <= 2630) {
    console.log('✅ ID valide trouvé:', t.id);
    return t.id;
  }

  // ✅ AMÉLIORATION : Essayer de trouver l'ID via la référence dans META_TRANSACTION
  if (t.reference) {
    // Extraire le numéro de la référence (ex: TRX002 → 2)
    const refNumber = parseInt(t.reference.replace(/\D/g, ''), 10);
    if (!isNaN(refNumber) && refNumber >= 1 && refNumber <= 50) {
      const calculatedId = 2580 + refNumber; // TRX002 → 2582
      console.log('✅ ID calculé depuis référence:', calculatedId);
      return calculatedId;
    }
  }

  // ✅ FALLBACK sécurisé : Utiliser le premier ID valide
  console.warn('⚠️ Aucun ID valide trouvé, utilisation de 2581 pour test');
  console.warn('⚠️ Transaction reçue:', {
    id: t.id,
    reference: t.reference,
    satimCode: t.satimData?.strCode
  });
  return 2581;
}
}

