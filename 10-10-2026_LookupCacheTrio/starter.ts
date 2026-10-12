// In-memory lookup caches for ClaimSure's internal tools. Each screen was
// hammering the API for the same policies/claims/members over and over, so
// these three caches went in fast, one per entity, to cut that down.

export interface Policy {
  id: string;
  holderName: string;
  premiumCents: number;
}

export interface Claim {
  id: string;
  policyId: string;
  amountCents: number;
}

export interface Member {
  id: string;
  policyId: string;
  name: string;
}

export class PolicyCache {
  private entries = new Map<string, Policy>();

  get(id: string): Policy | undefined {
    return this.entries.get(id);
  }

  set(entity: Policy): void {
    this.entries.set(entity.id, entity);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  get size(): number {
    return this.entries.size;
  }
}

export class ClaimCache {
  private entries = new Map<string, Claim>();

  get(id: string): Claim | undefined {
    return this.entries.get(id);
  }

  set(entity: Claim): void {
    this.entries.set(entity.id, entity);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  get size(): number {
    return this.entries.size;
  }
}

export class MemberCache {
  private entries = new Map<string, Member>();

  get(id: string): Member | undefined {
    return this.entries.get(id);
  }

  set(entity: Member): void {
    this.entries.set(entity.id, entity);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  get size(): number {
    return this.entries.size;
  }
}
