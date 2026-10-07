# Product Grid Search

The storefront's category pages show a grid of `ProductCard`s. Search-as-you-type got bolted on top last sprint - the product list was already loaded client-side, so filtering it in the browser as someone types was the fastest way to ship it.

## Setup

```
cd 10-05-2026_ProductGridSearch
npm install
```

## Restrictions

- Any modifications to a test should maintain the spirit of the original test.
- Keep `ProductGrid` and `ProductCard` exported with their current props and behavior from the outside - typing in the search box filters the grid, matching products render as cards, clicking a card's button adds that product to the cart. You're free to restructure the internals.
- Don't "fix" this by removing the search box's live filtering (e.g. requiring a submit button) - it needs to keep filtering as the person types. The problem isn't that it filters live; it's something else.

## Running Tests

```
npm test
```

## The Challenge

`ProductGrid` filters its product list against whatever's in the search box and renders a `ProductCard` for each match. Each card is wrapped in something that's supposed to let React skip re-rendering it when nothing about it has actually changed, since a category page can have a few hundred products on it.

It works correctly - every test here passes, filtering is accurate, add-to-cart fires for the right product every time. But a couple of people on lower-end laptops have mentioned the search box feels a little sluggish once a category page has more than fifty or so products loaded, especially a letter or two into typing, even though the number of products actually matching at that point is usually smaller, not larger.

Merchandising wants to add a "quick view" hover preview to each card next - a bit more markup and a bit more logic per card. Nobody's worried about a single card getting heavier to render. They're worried about what happens to typing responsiveness if a hundred of those heavier cards are all doing more work than they need to, every time someone presses a key that has nothing to do with most of them.

## Goals

- Make the code easier to maintain and extend long-term.
- Typing in the search box shouldn't cost more rendering work than it has to for cards whose own data hasn't changed.
- Leave the grid in a shape where a heavier `ProductCard` (like the planned quick-view preview) doesn't make the search box feel worse.

## Bonus Challenge

- Add a render counter (even just a `console.log` in `ProductCard`) and verify, by typing a single character, exactly how many cards re-render before and after your change, for a product list of a few hundred items.

## If you get stuck

- `ProductCard` is wrapped in something that's supposed to let React skip re-rendering it when its props haven't meaningfully changed. What would make React consider a prop to have "changed" between renders even when it does the exact same thing every time it's called?
- Try temporarily logging from inside `ProductCard` every time it runs, then type one character into the search box and count how many times you see it - for a card that stays visible, matching, and otherwise unchanged the whole time.
- Of the three things `ProductGrid` passes down to each card (`product`, `onAddToCart`, `onRender`), which one is actually a new value every single render, regardless of whether anything the person can see has changed?

## When you're ready for a review

Don't look for a solution here - there isn't one checked in. Once your tests pass and you're happy with your change (or you're stuck and want a second opinion), bring your code to Claude and ask for a review of this exercise. Claude will read this README, your code, and `progress.jsonl`, then walk through: your approach → bugs/issues → an alternative approach → the underlying concept → one thing to remember. It'll also update `progress.jsonl` with what it saw.
