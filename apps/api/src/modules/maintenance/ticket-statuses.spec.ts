import { assertTicketTransition, TICKET_STATUS } from './ticket-statuses';

describe('ticket-statuses', () => {
  it('allows the forward happy path', () => {
    expect(() =>
      assertTicketTransition(TICKET_STATUS.OPEN, TICKET_STATUS.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      assertTicketTransition(TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.RESOLVED),
    ).not.toThrow();
    expect(() =>
      assertTicketTransition(TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertTicketTransition(TICKET_STATUS.CLOSED, TICKET_STATUS.OPEN),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertTicketTransition(TICKET_STATUS.RESOLVED, TICKET_STATUS.IN_PROGRESS),
    ).toThrow(/Invalid status transition/);
  });
});
