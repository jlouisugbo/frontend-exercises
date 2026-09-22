# Notification Center

**Category:** React state & architecture
**Difficulty:** 1 / 10 (baseline -- difficulty ramps as the week goes on)

## AI

There's no rule against using AI here, but the whole point of daily practice is building your own instincts. Try refactoring with your own judgment first -- read the code, form a hypothesis about what's wrong, make the change, rerun the tests. Bring in AI afterward if you want a second opinion or to compare approaches, not as the first move.

## Setup

Each day's exercise is standalone with its own `package.json`, independent of every other day. Navigate into this directory before running any commands.

```
npm install
```

## Restrictions

* Any modifications to a test should maintain the spirit of the original test.
* Keep the exported hook named `useNotificationCenter` so other (hypothetical) code in the app can keep consuming it -- but you're free to change everything about how it's implemented internally, and free to change or add other exports.
* Don't add new npm dependencies beyond what's already in `package.json`.

## Running Tests

```
npm test
```

All tests currently pass against the code as written. They should still pass after your refactor -- if one breaks, decide whether you changed behavior you shouldn't have, or whether the test itself needs updating (see the seam comment at the top of `notification.test.ts`).

## The Challenge

`useNotificationCenter` is the hook every notification-related component in the app uses -- the bell icon badge, the dropdown list, anywhere else that needs to read or mutate notifications. It's been in the app for months, works in the demo page, and nobody's touched it since it shipped.

Skim `starter.ts`. Notice where the actual list of notifications lives, how components find out it changed, and what happens over the lifetime of a component that uses this hook -- not just at the moment it first renders.

### The Breaking Point

Design wants a `<NotificationBell />` that lives inside a popover -- users click it open, click elsewhere to close it, dozens of times over the course of a workday. After it ships, support starts getting reports that the unread badge count is climbing well past the actual number of notifications the longer someone's had the tab open, and that the tab itself gets sluggish after a while. Nobody can reproduce it by adding a couple of test notifications -- it only shows up after a lot of opening and closing.

## Goals

* Make the code easier to maintain and extend long-term -- the goal isn't just to make today's flaw disappear, it's to leave the next change (a new notification source, a new consumer component) easy to make without reopening what you just refactored.
* A component using this hook should behave identically no matter how many times it mounts and unmounts over the page's lifetime.
* Reading the current notification state shouldn't depend on components guessing when to re-render.

## Bonus Challenge

* Swap the manual "force a re-render" trick for `useSyncExternalStore`, so this plays correctly with concurrent React features.
* Replace the raw `type: string` field with a proper union type, so a typo like `'sucess'` is a compile error instead of a silent no-op in whatever UI switches on it.

## If you get stuck

* Look closely at what a React effect's setup function is *supposed* to return, and whether this one does.
* Walk through what happens the second time a component using this hook mounts -- not the first.
* Ask where "the truth" about the current notification list actually lives: in something React is tracking, or somewhere React doesn't know about?

## Submitting

When you're done (or stuck and want a check-in), paste your refactored code back in the chat with Claude and you'll get concise corrections plus one takeaway to carry into tomorrow's exercise.
