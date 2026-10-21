# Team Time-Off Panel

You're on the internal tools team building the manager dashboard for the HR platform. `TeamTimeOffPanel` shows a team's time-off requests for a selected month, and managers can flip on a "who's out today" view. It's been live for a quarter and nobody's filed a bug against it.

## Setup

cd 10-21-2026_TeamTimeOffPanel
npm install

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep the public prop interface (`teamId`, `selectedMonth`, `viewMode`, and the three collaborator functions) intact - other parts of the dashboard already pass these in and shouldn't need to change.

## Running Tests

npm test

## The Challenge

`TeamTimeOffPanel` does three things once it's showing a team: it loads that team's time-off requests for the selected month, it pings an analytics callback so Leadership can see how often each team's panel actually gets looked at, and - if a manager has it open - it polls a "who's out today" endpoint every 30 seconds. All three jobs live inside the same `useEffect`, which felt natural when the component only did the first of them and grew the other two on top over a couple of sprints.

It's held up fine in everyday use: switching the month shows the right requests, and the manager toggle starts and stops the live polling correctly. But Leadership just asked for a "panel views per team, per week" number to help decide which teams' admins still need this dashboard versus ones who've moved on to the newer org chart tool. The data engineer pulling the report came back confused - a few managers who use this daily to click through several months in a row are generating dozens of "views" a day for a single sitting, while others who open it once and leave it on are correctly showing one. The counts don't look anything like actual usage.

Before you reach for the obvious "just debounce the analytics call," figure out why a plain month change is producing a fresh "view" at all, and think about what else in this effect is riding along with it that maybe shouldn't be.

## Goals

- Make the code easier to extend and trust without changing its public prop interface.
- Fix the view-tracking so that showing a team counts as one view per sitting, not once per month/mode change.
- Keep the existing month-fetching and manager polling behavior working exactly as it does today.

## Bonus Challenge

- The polling path re-fetches "who's out today" immediately whenever the effect re-runs, even when the only thing that changed was the selected month (which has nothing to do with who's out today right now). See if you can make each concern only redo its own work when its own inputs change.

## If you get stuck

- Write out, in plain English, what has to be true for each of the three jobs in the effect to need to re-run. Do they actually share the same answer?
- Try logging (or counting, like the tests do) how many times each collaborator function gets called across a sequence of prop changes, and compare that against how many times you'd expect each one to fire.
- `useEffect`'s dependency array controls one job's re-run condition. What happens when a single effect is doing more than one job but only has one dependency array to describe all of their conditions?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
