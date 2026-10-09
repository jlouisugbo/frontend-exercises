# Course Enrollment Engine

BrightPath University's registration portal wires the "Enroll" button on every course section straight to one function: check whether the student qualifies, and if so, lock in the seat. It's covered every registration period since launch.

## Setup

```
cd 10-09-2026_CourseEnrollmentEngine
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `attemptEnrollment`'s exported name and its current eligibility rules (prerequisites, schedule conflict, credit hour limit, seat availability) intact, in that order. You're free to change its signature and whatever else lives in this file.

## Running Tests

```
npm test
```

## The Challenge

`attemptEnrollment` is the only thing standing between a student clicking "Enroll" on a section and actually landing a seat in it. It checks four things in order - whether the student has completed every prerequisite course, whether the section's meeting time collides with anything already on their schedule, whether adding it would push them over their credit hour limit for the term, and whether a seat is actually open - and if all four pass, it takes the seat and updates the student's record.

That's been fine, because the only caller is the real "Enroll" button, clicked by someone who has already decided to register for that specific section.

Now the registrar's office wants a "Would I get in?" planner on the course catalog page: a student browsing sections for next term should be able to click a small checkmark next to any section and see, instantly, whether they'd currently qualify for it - before they've picked their actual schedule, and without it costing them (or anyone else) a seat. The obvious way to wire this up is to call the exact same function the Enroll button calls and show whatever it returns. The one thing nobody's tested yet: what happens if a popular 9am section has exactly one seat left, and three students each click the planner's checkmark on it before any of them actually enrolls?

## Goals

- Make the code easier to maintain and extend long-term.
- Support a way to check enrollment eligibility that's safe to call as often as the planner wants, without it being able to affect who actually ends up with a seat.
- Keep `attemptEnrollment`'s existing four eligibility rules and their order intact - this isn't about changing what makes a student eligible, just about how checking and committing relate to each other.

## Bonus Challenge

- Add a lightweight audit log (an in-memory array is fine) that records every *committed* enrollment - but not every planner check - so the registrar can later answer "how many students actually enrolled in this section" without the count being inflated by planner traffic.

## If you get stuck

- Write down, in one sentence each, what "check if a student is eligible" means and what "enroll a student" means. Does `attemptEnrollment` currently do only one of those?
- If the catalog page called `attemptEnrollment` twice in a row for the same student and section - once for the planner checkmark, once for the real Enroll button - what would the second call see that the first call didn't cause?
- Look for a way to answer the eligibility question without touching `section.seatsAvailable` or `student` at all, plus a separate step that only runs once you already know the answer is yes.

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
