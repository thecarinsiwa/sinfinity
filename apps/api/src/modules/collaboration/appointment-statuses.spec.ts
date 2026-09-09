import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_TRANSITIONS,
  assertAppointmentTransition,
} from './appointment-statuses';

describe('appointment-statuses (transitions)', () => {
  it('allows scheduled → completed|cancelled|no_show', () => {
    for (const to of [
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.NO_SHOW,
    ] as const) {
      expect(() =>
        assertAppointmentTransition(APPOINTMENT_STATUS.SCHEDULED, to),
      ).not.toThrow();
    }
  });

  it('rejects reverse from terminal statuses', () => {
    for (const from of [
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.NO_SHOW,
    ] as const) {
      expect(() =>
        assertAppointmentTransition(from, APPOINTMENT_STATUS.SCHEDULED),
      ).toThrow(/Invalid status transition/);
    }
  });

  it('rejects same-status transition', () => {
    expect(() =>
      assertAppointmentTransition(
        APPOINTMENT_STATUS.SCHEDULED,
        APPOINTMENT_STATUS.SCHEDULED,
      ),
    ).toThrow(/already/);
  });

  it('exposes terminal empty maps', () => {
    expect(APPOINTMENT_STATUS_TRANSITIONS.scheduled).toEqual([
      'completed',
      'cancelled',
      'no_show',
    ]);
    expect(APPOINTMENT_STATUS_TRANSITIONS.completed).toEqual([]);
  });
});
