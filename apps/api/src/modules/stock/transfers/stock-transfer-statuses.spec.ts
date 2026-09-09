import {
  assertStockTransferTransition,
  STOCK_TRANSFER_STATUS,
} from './stock-transfer-statuses';

describe('stock-transfer-statuses', () => {
  it('allows the forward happy path and cancel branches', () => {
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.DRAFT,
        STOCK_TRANSFER_STATUS.IN_TRANSIT,
      ),
    ).not.toThrow();
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.IN_TRANSIT,
        STOCK_TRANSFER_STATUS.COMPLETED,
      ),
    ).not.toThrow();
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.DRAFT,
        STOCK_TRANSFER_STATUS.CANCELLED,
      ),
    ).not.toThrow();
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.IN_TRANSIT,
        STOCK_TRANSFER_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.IN_TRANSIT,
        STOCK_TRANSFER_STATUS.DRAFT,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.COMPLETED,
        STOCK_TRANSFER_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.CANCELLED,
        STOCK_TRANSFER_STATUS.DRAFT,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.DRAFT,
        STOCK_TRANSFER_STATUS.COMPLETED,
      ),
    ).toThrow(/Invalid status transition/);
  });

  it('rejects same-status transitions', () => {
    expect(() =>
      assertStockTransferTransition(
        STOCK_TRANSFER_STATUS.DRAFT,
        STOCK_TRANSFER_STATUS.DRAFT,
      ),
    ).toThrow(/already "draft"/);
  });
});
