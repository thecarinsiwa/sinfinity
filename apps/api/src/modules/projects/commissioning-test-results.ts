export const COMMISSIONING_TEST_RESULTS = ['pass', 'fail', 'partial'] as const;

export type CommissioningTestResult =
  (typeof COMMISSIONING_TEST_RESULTS)[number];

export const COMMISSIONING_TEST_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  PARTIAL: 'partial',
} as const satisfies Record<string, CommissioningTestResult>;
