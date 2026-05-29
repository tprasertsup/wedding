# Photo Checklist

All photos go in the `images/` folder. Once you add them, paste the filename into the right spot in `index.html`.

---

## 1. Couple Section — Childhood Photos

Each card front has a circular placeholder waiting for a photo.

**What to add:** One fun childhood photo of Nine, one of Tom. Candid, not formal — the more personality the better.

**Where to put the files:** `images/nine-kid.jpg` and `images/tom-kid.jpg` (any common format works: jpg, png, webp)

**How to wire them in** — open `index.html` and find these two blocks (search for `couple-photo-slot`):

For Nine's card:
```html
<!-- BEFORE (empty slot) -->
<div class="couple-photo-slot"></div>

<!-- AFTER (with photo) -->
<div class="couple-photo-slot">
  <img src="images/nine-kid.jpg" alt="Nine as a kid" />
</div>
```

For Tom's card:
```html
<!-- BEFORE (empty slot) -->
<div class="couple-photo-slot"></div>

<!-- AFTER (with photo) -->
<div class="couple-photo-slot">
  <img src="images/tom-kid.jpg" alt="Tom as a kid" />
</div>
```

The photo will be automatically cropped into a circle — no extra work needed.

---

## 2. Our Story — Photo Deck

The scroll deck in the "Our Story" section already has 10 photo slots. They currently show placeholder colors. Replace each one with a real photo of the two of you.

**Where to put the files:** `images/story-1.jpg` through `images/story-10.jpg`

**How to wire them in** — in `index.html`, search for `deck-photo`. You'll see elements like:

```html
<div class="deck-photo photo-drop" style="...">
```

Add an `<img>` inside each one:

```html
<div class="deck-photo photo-drop" style="...">
  <img src="images/story-1.jpg" alt="" />
</div>
```

Do the same for story-2 through story-10 in order.

**Photo tips:**
- Portrait orientation works best (taller than wide)
- Any candid moment works — trips, everyday life, the proposal, anything that tells your story
- They don't need to be in chronological order but it's a nice touch if they are

---

## Quick Reference

| Placeholder | File to add | Where in index.html |
|---|---|---|
| Nine's circular photo | `images/nine-kid.jpg` | First `<div class="couple-photo-slot">` |
| Tom's circular photo | `images/tom-kid.jpg` | Second `<div class="couple-photo-slot">` |
| Story photo 1–10 | `images/story-1.jpg` … `images/story-10.jpg` | Each `<div class="deck-photo …">` |
