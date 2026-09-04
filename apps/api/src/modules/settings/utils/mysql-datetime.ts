/** MySQL DATETIME(3) string without timezone suffix. */
export function nowMysqlDateTime(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

/** Calendar date YYYY-MM-DD (UTC). */
export function todayMysqlDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toBool(value: number | boolean): boolean {
  return value === true || value === 1;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
