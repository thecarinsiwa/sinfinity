import { Module } from '@nestjs/common';
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
  ],
  providers: [
    InvoicesService,
    AccountsLedgerService,
    PaymentMethodsService,
    PaymentsService,
  ],
  exports: [
    InvoicesService,
    AccountsLedgerService,
    PaymentMethodsService,
    PaymentsService,
  ],
})
export class FinancesModule {}
