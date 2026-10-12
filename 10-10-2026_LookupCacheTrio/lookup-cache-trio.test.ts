import { describe, it, expect } from 'vitest';
import { PolicyCache, ClaimCache, MemberCache, type Policy, type Claim, type Member } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how each cache gets constructed. If you
// refactor the internals (e.g. a shared generic implementation the three
// classes delegate to), update ONLY the helpers below - the test cases
// underneath should keep working unchanged as long as PolicyCache,
// ClaimCache, and MemberCache keep their current exported names and
// get/set/has/delete/size behavior.

function makePolicyCache(): PolicyCache {
  return new PolicyCache();
}

function makeClaimCache(): ClaimCache {
  return new ClaimCache();
}

function makeMemberCache(): MemberCache {
  return new MemberCache();
}

const samplePolicy: Policy = { id: 'pol-1', holderName: 'Dana Osei', premiumCents: 12000 };
const sampleClaim: Claim = { id: 'clm-1', policyId: 'pol-1', amountCents: 54000 };
const sampleMember: Member = { id: 'mem-1', policyId: 'pol-1', name: 'Dana Osei' };
// -------------------------------------------------------------------------

describe('PolicyCache', () => {
  it('returns undefined and reports false for an id that was never set', () => {
    const cache = makePolicyCache();

    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('stores and retrieves a policy by id', () => {
    const cache = makePolicyCache();
    cache.set(samplePolicy);

    expect(cache.get('pol-1')).toEqual(samplePolicy);
    expect(cache.has('pol-1')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('deletes a stored policy and reports whether anything was removed', () => {
    const cache = makePolicyCache();
    cache.set(samplePolicy);

    expect(cache.delete('pol-1')).toBe(true);
    expect(cache.delete('pol-1')).toBe(false);
    expect(cache.size).toBe(0);
  });
});

describe('ClaimCache', () => {
  it('returns undefined and reports false for an id that was never set', () => {
    const cache = makeClaimCache();

    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('stores and retrieves a claim by id', () => {
    const cache = makeClaimCache();
    cache.set(sampleClaim);

    expect(cache.get('clm-1')).toEqual(sampleClaim);
    expect(cache.has('clm-1')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('deletes a stored claim and reports whether anything was removed', () => {
    const cache = makeClaimCache();
    cache.set(sampleClaim);

    expect(cache.delete('clm-1')).toBe(true);
    expect(cache.delete('clm-1')).toBe(false);
    expect(cache.size).toBe(0);
  });
});

describe('MemberCache', () => {
  it('returns undefined and reports false for an id that was never set', () => {
    const cache = makeMemberCache();

    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('stores and retrieves a member by id', () => {
    const cache = makeMemberCache();
    cache.set(sampleMember);

    expect(cache.get('mem-1')).toEqual(sampleMember);
    expect(cache.has('mem-1')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('deletes a stored member and reports whether anything was removed', () => {
    const cache = makeMemberCache();
    cache.set(sampleMember);

    expect(cache.delete('mem-1')).toBe(true);
    expect(cache.delete('mem-1')).toBe(false);
    expect(cache.size).toBe(0);
  });
});
