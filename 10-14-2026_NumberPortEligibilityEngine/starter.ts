// Number port-in eligibility + reservation for MobileFirst Wireless's
// self-service "Bring Your Number" flow. Written against a hard FCC
// porting-window deadline - one pass: check the rules, and if everything
// lines up, reserve the slot and start the port.

export interface CarrierAccount {
  id: string;
  standing: 'good' | 'past_due' | 'suspended';
  pin: string;
}

export interface PortableLine {
  id: string;
  phoneNumber: string;
  portStatus: 'none' | 'in_progress' | 'completed';
}

export interface PortBatch {
  date: string; // e.g. "2026-10-14"
  slotsRemaining: number;
}

export interface PortRequest {
  phoneNumber: string;
  enteredPin: string;
}

export interface PortResult {
  eligible: boolean;
  reason: string;
}

/**
 * Checks whether `request` can port `line`'s number in from `account`'s
 * losing carrier today, and - if so - reserves a batch slot and starts
 * the port.
 *
 * Wired directly to the "Start My Port" button on the self-service
 * port-in page.
 */
export function attemptPortIn(
  request: PortRequest,
  line: PortableLine,
  account: CarrierAccount,
  batch: PortBatch
): PortResult {
  if (account.standing !== 'good') {
    return {
      eligible: false,
      reason: 'Account is not in good standing with the losing carrier.',
    };
  }

  if (line.portStatus !== 'none') {
    return {
      eligible: false,
      reason: 'This number already has a port in progress.',
    };
  }

  if (request.enteredPin !== account.pin) {
    return {
      eligible: false,
      reason: 'PIN does not match the account on file.',
    };
  }

  if (batch.slotsRemaining <= 0) {
    return {
      eligible: false,
      reason: "No port slots available in today's batch.",
    };
  }

  // Everything checks out - reserve the slot and start the port.
  batch.slotsRemaining -= 1;
  line.portStatus = 'in_progress';

  return {
    eligible: true,
    reason: 'Port started.',
  };
}
