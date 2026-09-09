import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices/invoices.controller';
import { InvoicesService } from './invoices/invoices.service';
import { AccountsLedgerService } from './ledger/accounts-ledger.service';

/**
 * Phase 17 — Facturation et finances (invoices, payments, expenses, ledger).
 */
@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, AccountsLedgerService],
  exports: [InvoicesService, AccountsLedgerService],
})
export class FinancesModule {}
