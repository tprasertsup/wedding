# Image Guide — Just Drop the Files In

Everything is already wired up. You only need to put your photos in the `images/` folder with the exact file names below. No code editing needed.

---

| File name | What it's for | Best orientation |
|---|---|---|
| `hero-couple.jpg` | The framed photograph under the invitation type in the hero | Portrait (tall) — shown as a 3:4 crop |
| `nine-kid.png` | Nine's childhood photo on the couple card | Square |
| `tom-kid.png` | Tom's childhood photo on the couple card | Square |
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

---

**Notes:**
- jpg, png, and webp all work for any slot
- The hero photo is cropped to 3:4 and anchored slightly above center (`object-position: center 30%` in `assets/css/main.css`) — if a different crop suits your photo better, that is the one value to change
- `couple.png`, `hero-desktop.jpg` and the two `hero-*-empty-space.png` files are left over from the previous hero and are no longer referenced
- The story deck cards reveal from card 10 down to card 1 as the user scrolls, so put your favorite/most striking photo as `story-10.jpg` since it appears first
- Story cards 6–10 still have placeholder captions ("Caption six" etc.) — let me know what captions you'd like and I'll update them
