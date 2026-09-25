# Frontend Exercises

Daily frontend engineering practice: one dated exercise folder per day. Exercises rotate through code review, debugging, architecture tradeoffs, TypeScript modeling, and React state/performance. Each folder contains its own setup, starter code, and tests.

## How to use

1. Open a dated folder (`MM-DD-YYYY_ExerciseName/`) and read its README.
2. Run `npm install`, `npm test`, and `npm run typecheck` from inside that folder.
3. Work on an exercise branch and share the branch or diff for review.
4. After review, use the feedback to revise; passing starter tests alone does not establish completion.

## Progress

[.progress.json](.progress.json) is the compact exercise index. Each `log` entry records a folder, category, topic, difficulty, submission status, completion status, review notes, offered takeaways, and whether a concept should recur. Its `_fields` and `_generation_rules` document the format.

`assigned` means an exercise was published; it does not mean the learner started it. `reviewed` means an attempt was evaluated; `needs_revision` remains until the exercise acceptance criteria are met. Review notes describe evidence from the submitted branch, and key learnings are suggested takeaways rather than proof of mastery.

The daily generator reads this file first to choose the next category and level, inspects recent exercises when needed, and appends an assigned entry after a successful push. A solution review updates its entry after verifying the branch and tests. The exercise source and submitted branch remain the source of truth for code details.
