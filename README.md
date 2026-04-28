# MAE 2026

Static site for the **McGill Architecture Exhibition 2026**.
Live at: **https://mae-mcgill.github.io/MAE/** · target domain: **mae-mcgill.ca**

## Files

```
index.html
styles.css
script.js
README.md

assets/
  fonts/
    PPNeueMontreal-Regular.otf       — site typeface
  sponsors/                          — sponsor logo PNGs
  plans/                             — access plan + key plans
  faces/                             — student portrait drawings
  project-images/                    — project hero images
  project-texts/                     — title / advisor / description
                                       (one .txt file per student)
```

---

## How auto-discovery works

You **never edit script.js to add a face, image, plan, or description**. Just upload the file with the right name in the right folder and it shows up automatically. Until a file exists, the page shows a "Coming soon" placeholder for that piece.

## Filename rules

- **Always lowercase**
- **Use hyphens** between words, never spaces or underscores
- **No accents** — for "Téa Canton" use `tea-canton`, for "Félix Bergeron" use `felix-bergeron`
- **No special characters** (apostrophes, periods, accents)

The site computes the expected filename from the student's name. The list of expected slugs is below — copy/paste from there if in doubt.

## File path table

| Asset                   | Path                                          | Accepted extensions       |
|-------------------------|-----------------------------------------------|---------------------------|
| Site typeface           | `assets/fonts/PPNeueMontreal-Regular.otf`     | otf                       |
| Sponsor logo            | `assets/sponsors/<short-name>.png`            | png (transparent BG)      |
| Access plan             | `assets/plans/access-plan.png`                | png                       |
| Key plan (per room)     | `assets/plans/<room-id>.png`                  | png, jpg                  |
| Student portrait        | `assets/faces/<slug>.png`                     | png, jpg, jpeg, webp      |
| Project hero image      | `assets/project-images/<slug>.jpg`            | jpg, jpeg, png, webp      |
| Project text (one file) | `assets/project-texts/<slug>.txt`             | txt                       |

`<room-id>` is one of `101`, `102`, `114`, `312`.
`<slug>` is the student's name, slug-form — see the list below.

---

## The 33 expected slugs

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

## Project text file format

One `.txt` file per student in `assets/project-texts/<slug>.txt`. There's a template at `assets/project-texts/_example.txt` you can duplicate.

Format:
```
TITLE: My Project Title
ADVISOR: Jane Doe

The body of the description starts after the first blank line.

Multiple paragraphs separated by blank lines. Aim for ~400 words.

That's it.
```

Rules:
- The header lines (`TITLE:`, `ADVISOR:`) come first, in any order.
- A **single blank line** separates header from body.
- The body is plain text — no markdown, no HTML.
- **Paragraphs in the body are separated by blank lines.**
- Any field can be omitted; missing fields show "Coming soon" on the project page.

The site fetches this file when a visitor opens that student's page. As soon as you commit a new `.txt` file (or edit an existing one), changes appear on a fresh page load.

---

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Note: `fetch()` doesn't work when you open `index.html` directly with a `file://` URL — use the local server above (or just push and check on GitHub Pages).

## Deploy on GitHub Pages

1. Push to `main` on `mae-mcgill/MAE`.
2. **Settings → Pages → Source:** `Deploy from a branch` · branch `main` · folder `/ (root)`.
3. Live at `https://mae-mcgill.github.io/MAE/` in ~1 minute.

## Custom domain · mae-mcgill.ca

1. Add a `CNAME` file containing exactly:
   ```
   mae-mcgill.ca
   ```
2. DNS at your registrar:
   - **Apex** `mae-mcgill.ca` — four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **www** `www.mae-mcgill.ca` — `CNAME` → `mae-mcgill.github.io`
3. **Settings → Pages**, enter the domain, then tick **Enforce HTTPS** once provisioned.

---

## What still requires script.js edits

Only two things now:

### Adding a student to the master list
`STUDENTS` array, top of `script.js`. Just the name as a string.

### Assigning students to rooms
`ROOMS` array. Drop names into the `students:` array of the room they're exhibiting in:
```js
{ id: "101", name: "Room 101", floor: "m2", students: [
  "Albert Assy",
  "Bianca Hacker",
  "Lucas Azar"
]},
```
Order in the array becomes the numbered order on the room card. The student's project page automatically picks up the room — no duplicate entry.

---

## Editing text on the page (header, footer, etc.)

In `index.html`:
- Header / footer text (address, dates, Instagram URL)
- Home brochure paragraph (`.home-paras`)
- Sponsors thank-you line + the 9 logo `<img>` tags (`.sponsors`)
- Information page text + map (`<section id="information">`)

## Visual tuning

In `styles.css`, top of file:
```css
--track:        -0.04em;   /* letter-spacing everywhere */
--text:         #0a0a0a;
--text-muted:   #b8b8b8;
```
For the giant MAE logo size on the home page, search `.hero--home` and adjust the `30vw` value.

---

## Notes

- Section URLs use hash routing. Subroutes for individual projects: `#project/<slug>`. Each student already has a working URL right now (showing all "coming soon" placeholders) — fill in the assets and they go live.
- **You can replace any image with a new version** by uploading a file with the same path; the site will pick it up immediately (after a hard refresh — browsers cache images).
- The cursor dot trails the mouse on desktop, hidden on touch devices.
