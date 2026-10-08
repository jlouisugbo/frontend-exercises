// Payroll event -> pay-run line item translator for Flexstaff's contractor
// payroll product. "bonus" events shipped for the EOY run; "correction"
// events came a sprint after that once finance needed a way to patch
// mistakes without re-running the whole payroll.

import { assert } from "vitest";

export type PayrollEventType = 'hire' | 'termination' | 'bonus' | 'correction';

type BasePayrollEvent = { 
  employeeId: string;
  effectiveDate: string; // ISO date
}
export type PayrollEvent = BasePayrollEvent & (
  | { type: "hire"; startingSalaryCents?: number }
  | { type: "termination"; severanceCents?: number }
  | { type: "bonus"; bonusAmountCents: number; bonusReason: string }
  | { type: "correction"; correctedFieldName: string; correctedValueCents: number }
  | { type: "rehire"; hrCompletions: number; newStartingSalary: number; }
);
export interface PayrollLineItem {
  employeeId: string;
  description: string;
  amountCents: number;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled event type: ${JSON.stringify(x)}`);
}

export function toLineItem(event: PayrollEvent): PayrollLineItem {
  switch (event.type) {
    case "hire": return handleHire(event)
    case "termination": return handleTermination(event)
    case "bonus": return handleBonus(event);
    case "correction": return handleCorrection(event);
    case "rehire": return handleRehire(event);
    default: return assertNever(event)
  }
}

const handleHire = (event: Extract<PayrollEvent, {type: "hire"}>) => {
  return {
    employeeId: event.employeeId,
    description: `Starting salary as of ${event.effectiveDate}`,
    amountCents: event.startingSalaryCents ?? 0,
  }; 
}

const handleTermination = (event: Extract<PayrollEvent, {type: "termination"}>) => {
  return {
    employeeId: event.employeeId,
    description: `Final pay and severance as of ${event.effectiveDate}`,
    amountCents: event.severanceCents ?? 0,
  }; 
}

const handleBonus = (event: Extract<PayrollEvent, {type: "bonus"}>) => {
  return {
    employeeId: event.employeeId,
    description: event.bonusReason ?? 'Bonus',
    amountCents: event.bonusAmountCents ?? 0,
  };
}

const handleCorrection = (event: Extract<PayrollEvent, {type: "correction"}>) => {
  return {
    employeeId: event.employeeId,
    description: `Correction: ${event.correctedFieldName ?? 'unspecified field'}`,
    amountCents: event.correctedValueCents ?? 0,
  };
}

const handleRehire = (event: Extract<PayrollEvent, {type: "rehire"}>) => {
  return {
    employeeId: event.employeeId,
    description: `New starting salary as of ${event.effectiveDate}, HR trainings completed ${event.hrCompletions}`,
    amountCents: event.newStartingSalary
  }; 
}
