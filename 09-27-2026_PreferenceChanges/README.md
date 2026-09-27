# Preference Changes

**Exercise #7 · Focus:** TypeScript modeling  
**Difficulty:** 1/5  
**Target time:** 40–55 focused minutes

## Scenario

A dashboard stores three user preferences: color theme, results per page, and compact layout mode. Application code creates trusted preference changes, while persisted browser data enters through `applyStoredPreferenceChange` as `unknown`. Both paths eventually update the same immutable preference state.

The runtime behavior is correct and all supplied tests pass. The public TypeScript contract is less helpful than the runtime checks: a key and a value can each be valid somewhere in the preference system while still being invalid together. Callers therefore discover some mistakes only when the function executes.

## Current pain

The compiler currently accepts calls equivalent to these:

```ts
applyPreferenceChange(state, { key: "pageSize", value: "dark" });
applyPreferenceChange(state, { key: "compactMode", value: 50 });
```

It also describes every result of `readPreference` as the full set of possible preference values. A caller reading `theme` cannot learn from the return type that only `"light"` or `"dark"` can come back.

The runtime boundary must remain defensive because persisted JSON is untrusted. The trusted application API should make invalid key/value combinations difficult to express before execution.

## The breaking point

Product is adding notification frequency and date-format preferences. Several feature teams will call this module directly, and a migration will replay older values from local storage. Expanding one global key union and one global value union would allow more unrelated combinations while forcing runtime checks to compensate.

## Your task

Refactor `starter.ts` so the selected preference key determines the value accepted or returned by the trusted API. Keep untrusted persisted input behind an explicit runtime boundary. Preserve current behavior, error messages, immutable updates, and the existing exported function names.

Your design should provide one authoritative description of the preference schema. Adding a new preference should guide the developer toward every place that needs runtime handling without requiring duplicated handwritten lists to remain synchronized.

The helper block near the top of `preference.test.ts` is the intended adaptation seam if a more precise public type makes its broad helper inappropriate.

## Restrictions

- Do not use `any`, `as unknown as`, or a type assertion that merely claims a value matches its key.
- Do not replace compile-time relationships with additional runtime-only checks.
- Do not remove validation from `applyStoredPreferenceChange`; its input must remain `unknown` at the boundary.
- Do not weaken or delete behavioral assertions.
- Do not mutate the supplied state or changes array.
- Avoid one overload or one unrelated public function per preference key.
- Do not add dependencies.

## Acceptance criteria

- `npm test` and `npm run typecheck` pass under strict TypeScript.
- Reading `"theme"` is inferred as `"light" | "dark"`, reading `"pageSize"` as `10 | 25 | 50`, and reading `"compactMode"` as `boolean`.
- Trusted changes reject mismatched key/value pairs at compile time.
- A batch cannot contain a mismatched key/value pair without a compile-time error.
- Correct trusted changes remain ergonomic and do not require assertions at call sites.
- Stored input is checked at runtime before it becomes a trusted change.
- Unknown keys, unsupported value types, and values valid only for another key retain their current errors.
- Adding a preference to the authoritative schema produces useful compiler guidance for the trusted API and boundary handling.

## Type-contract checks to add

Runtime tests cannot prove the public type contract. Add a small `type-contract.ts` included by `tsconfig.json`, using assignments and `// @ts-expect-error` deliberately. It should prove at least these ideas:

- a theme read can be assigned to `"light" | "dark"`;
- a page-size read can be assigned to `10 | 25 | 50`;
- `{ key: "pageSize", value: "dark" }` is rejected;
- `{ key: "compactMode", value: 50 }` is rejected;
- a valid mixed batch compiles while a batch containing one mismatched pair does not.

An `@ts-expect-error` is useful only when the following line genuinely fails. If it becomes unused, the typecheck should fail.

## Suggested workflow

1. Run the baseline test and typecheck commands.
2. Identify which declaration is the authoritative mapping from each preference name to its value.
3. Write the type-contract checks before changing the implementation.
4. Refine one public function at a time, beginning with reads and a single change.
5. Adapt the test helper seam when its broad input no longer represents a valid trusted change.
6. Revisit the storage boundary last and trace how each checked branch creates a trusted value.
7. Add a temporary fourth preference and observe which compiler errors guide the integration, then remove it.

## Questions to answer when you submit

- Where does a stored `unknown` value become trusted?
- Which declaration connects each key to its value type?
- Why is a union of all keys plus a separate union of all values insufficient?
- How does your batch type preserve each individual key/value relationship?
- What work is still necessarily runtime work even after the trusted API is precise?

## Bonus challenges

- Return a typed result object for invalid stored input instead of throwing.
- Attach a default value to each preference while keeping defaults checked against the same schema.
- Model a versioned persisted payload and migrate a valid older page-size value.
- Add a `resetPreference` operation whose key determines the reset value without duplicating defaults.

## Non-spoiler hints

<details><summary>Hint 1</summary>

Start from the existing object type. Ask how TypeScript can look up the value type at one selected property key.

</details>

<details><summary>Hint 2</summary>

The change type must represent a relationship between two fields, not two independent unions.

</details>

<details><summary>Hint 3</summary>

For a batch, build the set of valid change shapes from the schema instead of writing each shape twice.

</details>

<details><summary>Hint 4</summary>

At the `unknown` boundary, narrowing the key first can tell you which validation the value requires.

</details>

## Setup and run commands

Use Node 20 or newer. From inside this dated directory:

```bash
npm ci
npm test
npm run typecheck
```

For watch mode:

```bash
npm run test:watch
```

## Submission

Share your branch or diff, `type-contract.ts`, and brief answers to the five questions. The review will give concise corrections and exactly one memorable takeaway.
