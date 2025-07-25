import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model'; // ← import depuis le bon fichier

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.css'],
  imports: [CommonModule, RouterModule]
})
export class AdminTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactionService.getAllTransactions().subscribe((data: Transaction[]) => {
      console.log("Transactions reçues :", data);
      this.transactions = data;
    });
  }
}
