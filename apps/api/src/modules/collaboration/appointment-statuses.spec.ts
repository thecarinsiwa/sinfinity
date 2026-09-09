import {
  assertAppointmentTransition,
  APPOINTMENT_STATUS,
} from './appointment-statuses';

describe('appointment-statuses', () => {
  it('allows scheduled → completed|cancelled|no_show', () => {
    expect(() =>
      assertAppointmentTransition(
        APPOINTMENT_STATUS.SCHEDULED,
        APPOINTMENT_STATUS.COMPLETED,
      ),
    ).not.toThrow();
    expect(() =>
      assertAppointmentTransition(
        APPOINTMENT_STATUS.SCHEDULED,
        APPOINTMENT_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse from completed', () => {
    expect(() =>
      assertAppointmentTransition(
        APPOINTMENT_STATUS.COMPLETED,
        APPOINTMENT_STATUS.SCHEDULED,
      ),
    ).toThrow(/Invalid status transition/);
  });
});
