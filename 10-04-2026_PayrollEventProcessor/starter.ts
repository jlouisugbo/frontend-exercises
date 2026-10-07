// Payroll event -> pay-run line item translator for Flexstaff's contractor
// payroll product. "bonus" events shipped for the EOY run; "correction"
// events came a sprint after that once finance needed a way to patch
// mistakes without re-running the whole payroll.

export type PayrollEventType = 'hire' | 'termination' | 'bonus' | 'correction';

export interface PayrollEvent {
  type: PayrollEventType;
  employeeId: string;
  effectiveDate: string; // ISO date

  // hire-only
  startingSalaryCents?: number;

  // termination-only
  severanceCents?: number;

  // bonus-only
  bonusAmountCents?: number;
  bonusReason?: string;

  // correction-only
  correctedFieldName?: string;
  correctedValueCents?: number;
}

export interface PayrollLineItem {
  employeeId: string;
  description: string;
  amountCents: number;
}

export function toLineItem(event: PayrollEvent): PayrollLineItem {
  if (event.type === 'hire') {
    return {
      employeeId: event.employeeId,
      description: `Starting salary as of ${event.effectiveDate}`,
      amountCents: event.startingSalaryCents ?? 0,
    };
  }

  if (event.type === 'termination') {
    return {
      employeeId: event.employeeId,
      description: `Final pay and severance as of ${event.effectiveDate}`,
      amountCents: event.severanceCents ?? 0,
    };
  }

  if (event.type === 'bonus') {
    return {
      employeeId: event.employeeId,
      description: event.bonusReason ?? 'Bonus',
      amountCents: event.bonusAmountCents ?? 0,
    };
  }

  // correction - and, for now, anything else that comes through.
  return {
    employeeId: event.employeeId,
    description: `Correction: ${event.correctedFieldName ?? 'unspecified field'}`,
    amountCents: event.correctedValueCents ?? 0,
  };
}
