import { Module } from '@nestjs/common';
import { ExpenseCategoriesController } from './expenses/expense-categories.controller';
import { ExpenseCategoriesService } from './expenses/expense-categories.service';
import { ExpensesController } from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';
import { InvoicesController } from './invoices/invoices.controller';
import { InvoicesService } from './invoices/invoices.service';
import { AccountsLedgerService } from './ledger/accounts-ledger.service';
import { PaymentMethodsController } from './payments/payment-methods.controller';
import { PaymentMethodsService } from './payments/payment-methods.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';

/**
 * Phase 17 — Facturation et finances (invoices, payments, expenses, ledger).
 */
@Module({
  controllers: [
    InvoicesController,
    PaymentMethodsController,
    PaymentsController,
    ExpenseCategoriesController,
    ExpensesController,
  ],
  providers: [
    InvoicesService,
    AccountsLedgerService,
    PaymentMethodsService,
    PaymentsService,
    ExpenseCategoriesService,
    ExpensesService,
  ],
  exports: [
    InvoicesService,
    AccountsLedgerService,
    PaymentMethodsService,
    PaymentsService,
    ExpenseCategoriesService,
    ExpensesService,
  ],
})
export class FinancesModule {}
