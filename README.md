# MAE 2026

Static site for the **McGill Architecture Exhibition 2026**.
Live at: **https://mae-mcgill.github.io/MAE/**

## What you can edit without touching code

Everything below lives in plain `.txt` files or image folders. Drop a file in the right place with the right name and it appears on the site after a refresh.

### File path table

| What                    | Where it goes                                  | File format        |
|-------------------------|------------------------------------------------|--------------------|
| Room assignments        | `assets/rooms.txt`                             | text               |
| Project text per student | `assets/project-texts/<slug>.txt`             | text               |
| Student portrait        | `assets/faces/<slug>.png`                      | png / jpg / webp   |
| Project hero image      | `assets/project-images/<slug>.jpg`             | jpg / png / webp   |
| Key plan (per room)     | `assets/plans/<room-id>.png`                   | png / jpg          |
| Access plan             | `assets/plans/access-plan.png`                 | png                |
| Sponsor logos           | `assets/sponsors/<short-name>.png`             | png                |

`<room-id>` is one of `101`, `102`, `114`, `312`.

### Filename rules

- **Always lowercase.**
- **Use hyphens** between words, never spaces or underscores.
- **No accents** — for "Téa Canton" use `tea-canton`, for "Félix Bergeron" use `felix-bergeron`.
- **No special characters** (apostrophes, periods, accents).

### The 33 expected slugs

Use these EXACTLY for face/image/text filenames.

```
albane-queinnec-barreau
albert-assy
alyssa-pangilinan
anastasia-cubasova
antoine-kirouac
audrey-boutot
bethany-wakelin
bianca-hacker
bronwyn-bell
dharshini-mahesh-babu
eliza-mihali
felix-bergeron
gael-haddad
ishaan-anand
jacob-haley
jeremy-turbide
jessica-villarasa
karine-payette
lucas-azar
ludovic-amyot
mallory-kerr
maria-jose-nolasco-ordonez
nicholas-santoianni
nicolea-apostolidis
oscar-lallier
qiqi-liu
sarah-delnour
sean-wolanyk
serena-valles
suehayla-eljaji
sunny-lan
tea-canton
victoria-fratipietro
```

So for Oscar Lallier:
- `assets/faces/oscar-lallier.png`
- `assets/project-images/oscar-lallier.jpg`
- `assets/project-texts/oscar-lallier.txt`

---

## How to edit room assignments

Open `assets/rooms.txt`. The format:

```
ROOM 101
Bethany Wakelin
Jessica Villarasa
Karine Payette
...

ROOM 102
Bianca Hacker
Félix Bergeron
...
```

Move a name from one room to another by cutting and pasting under the new `ROOM` heading. Order in the file = order shown on the room card. Lines starting with `#` are comments. Names must match the master list exactly (accents included) — typos will log a warning in the browser console.

## How to write a project page

Create `assets/project-texts/<slug>.txt` with this format:

```
TITLE: My Project Title
ADVISOR: Jane Doe

The body of the description starts after the first blank line. Plain text — no markdown, no HTML.

Multiple paragraphs separated by blank lines. Aim for ~400 words.
```

Rules:
- The header lines (`TITLE:`, `ADVISOR:`) come first, in any order.
- A **single blank line** separates header from body.
- **Paragraphs in the body are separated by blank lines.**
- Any field can be omitted; missing fields show "Coming soon" on the project page.

A template is included at `assets/project-texts/_example.txt` — duplicate it.

## How to add images

- **Faces** → `assets/faces/<slug>.png` (transparent background works)
- **Project images** → `assets/project-images/<slug>.jpg`
- **Key plans** → `assets/plans/101.png`, `102.png`, `114.png`, `312.png`
- **Sponsor logos** → already in `assets/sponsors/`

Filenames are case-sensitive on GitHub Pages. Use the slug exactly as listed above.

---

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

(Opening `index.html` directly with `file://` won't load the `.txt` files — the local server is required.)

## Deploy

GitHub Pages auto-deploys from `main` to `https://mae-mcgill.github.io/MAE/` whenever you push.

---

## Notes

- After uploading new images, browsers cache aggressively. Hard refresh with Cmd-Shift-R (Mac) or Ctrl-Shift-R (Windows) to see them immediately.
- Sub-pages for each student have their own URL: `https://mae-mcgill.github.io/MAE/#project/oscar-lallier`. Shareable.
- The site uses PP Neue Montreal Regular, served from `assets/fonts/`.
