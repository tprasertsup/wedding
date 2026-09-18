# Image Guide — Just Drop the Files In

Everything is already wired up. You only need to put your photos in the `images/` folder with the exact file names below. No code editing needed.

---

| File name | What it's for | Best orientation |
|---|---|---|
| `hero-couple.jpg` | The framed photograph under the invitation type in the hero | Portrait (tall) — shown as a 3:4 crop |
| `share-card.jpg` | The 1200×630 preview card shown when the link is shared on LINE, Messenger, iMessage etc. | Landscape — regenerate if the names, date or photo change |
| `nine-kid.jpg` | Nine's childhood photo on the couple card | Square |
| `tom-kid.jpg` | Tom's childhood photo on the couple card | Square |
| `story-1.jpg` | Our Story deck — card 1 (bottom of stack) | Portrait (tall) |
| `story-2.jpg` | Our Story deck — card 2 | Portrait (tall) |
| `story-3.jpg` | Our Story deck — card 3 | Portrait (tall) |
| `story-4.jpg` | Our Story deck — card 4 | Portrait (tall) |
| `story-5.jpg` | Our Story deck — card 5 | Portrait (tall) |
| `story-6.jpg` | Our Story deck — card 6 | Portrait (tall) |
| `story-7.jpg` | Our Story deck — card 7 | Portrait (tall) |
| `story-8.jpg` | Our Story deck — card 8 | Portrait (tall) |
| `story-9.jpg` | Our Story deck — card 9 | Portrait (tall) |
| `story-10.jpg` | Our Story deck — card 10 (top of stack, first seen) | Portrait (tall) |
| `map-le-pasiri.webp` | The illustrated directions map in the Venue section, shown instead of the Google map by default | Landscape — the frame matches its 1800×1081 shape |

---

**Notes:**
- jpg, png, and webp all work for any slot
- The hero photo is cropped to 3:4 and anchored slightly above center (`object-position: center 30%` in `assets/css/main.css`) — if a different crop suits your photo better, that is the one value to change
- Keep files small: everything here is resized to about 1200px on the long edge and 100–300 KB. The deck loads ten photos at once, so full-resolution camera files (2–4 MB each) make the page slow on mobile data
- The story deck cards reveal from card 10 down to card 1 as the user scrolls, so put your favorite/most striking photo as `story-10.jpg` since it appears first
- The directions map is the venue's own artwork, resized to 1800px wide and saved as webp (79 KB, down from the 4.2 MB original). If you swap it for a differently-shaped file, update the `width`/`height` on the `<img>` in `index.html` and the `aspect-ratio` on `.venue-map` in `assets/css/main.css` to match, or it will letterbox
- Story cards 6–10 still have placeholder captions ("Caption six" etc.) — let me know what captions you'd like and I'll update them
