# Sensor Fleet Registry

Northstar's field-ops dashboard tracks which sensors are wired into which gateway out in the field, and the repair-ticket workflow uses the same registry to record when a technician moves a sensor from one gateway to another.

## Setup

```
cd 10-15-2026_SensorFleetRegistry
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `FleetRegistry`'s exported public methods (`registerDevice`, `attachSensor`, `recordReading`, `getLatestReadingForDevice`, `moveSensor`) and the `reassignSensorAfterRepair` function's name intact - the dashboard and the repair-ticket workflow already import them by these names. You're free to change their parameter types and internals.

## Running Tests

```
npm test
```

## The Challenge

`FleetRegistry` tracks gateways (`Device`) and the sensors wired into them. Every id the module deals with - a gateway's id, a sensor's id - is just a `string`. `attachSensor`, `recordReading`, `getLatestReadingForDevice`, and `moveSensor` all take these ids as plain string parameters, several of them three to a call, and nothing in the types tells you which slot wants which kind of id beyond the parameter name sitting next to it.

That's worked out fine so far because every call site in the app happened to keep them in the right order - except one. `reassignSensorAfterRepair`, which the repair-ticket workflow calls once a technician logs a move, hands `moveSensor` the device id and the sensor id in the wrong two slots. The function still runs, still returns a boolean, and the compiler has no basis to object - a device id and a sensor id are both just `string` to it. The only symptom is that the registry quietly fails to record the move, something that eventually shows up as "the dashboard says this sensor is still on the old gateway" days after the actual mistake, nowhere near the ticket that caused it.

Ops now wants to stop filling out repair tickets by hand and run a batch script overnight instead, reassigning a few dozen sensors at once off a CSV an electrician exports from a spreadsheet during a maintenance window - the same call, repeated unattended, with nobody around if a column gets read in the wrong order. Before that ships, the team wants a mistake like the one above to stop compiling, not just rely on everyone keeping the argument order straight by convention.

## Goals

- Make the code easier to maintain and extend long-term.
- Make it a compile error - not just a convention - to pass a device id where a sensor id belongs, or vice versa, anywhere in `FleetRegistry` or `reassignSensorAfterRepair`.
- Fix `reassignSensorAfterRepair` once your changes make the mistake visible, and keep every other existing behavior intact - the current tests should keep passing unchanged.

## Bonus Challenge

- Add a small, single sanctioned way to produce each kind of id from a raw string (a constructor function, a factory, whatever shape fits), so a stray string literal typed in by hand can't sneak past the guarantee you just built either.

## If you get stuck

- Line up `moveSensor`'s parameter list against the order `reassignSensorAfterRepair` actually calls it with. What would have had to be true about the types involved for that mismatch to fail to compile instead of silently returning `false`?
- A `string` is happy to represent an id for anything. What's the smallest change to the type system - one that doesn't change what the values look like at runtime - that would make two kinds of string-backed id mutually incompatible?
- Whatever you build, every legitimate call site - inside `FleetRegistry`'s own methods, and in the test file's seam - still needs to compile and behave the same as it does today. You're adding a constraint, not changing the shape of the data.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
