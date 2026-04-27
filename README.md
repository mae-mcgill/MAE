# MAE 2026

Static site for the **McGill Architecture Exhibition 2026**.
Target domain: **mae-mcgill.ca**

## Stack

Plain HTML / CSS / JS. No build step. No dependencies.

## Files

```
index.html               — single page, all sections
styles.css               — typography (Helvetica Neue) + layout
script.js                — section switching, room renderer, cursor dot
README.md                — this file
assets/access-plan.png   — venue map shown on the Information page
assets/                  — drop sponsor logos and key-plan images here
CNAME                    — (add later) custom domain, one line: mae-mcgill.ca
```

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy on GitHub Pages

1. Push these files to `main` on `oslal-mcgill/MAE`.
2. **Settings → Pages → Source:** `Deploy from a branch` · branch `main` · folder `/ (root)`.
3. Live at `https://oslal-mcgill.github.io/MAE/` in ~1 minute.

## Custom domain · mae-mcgill.ca

1. Add a `CNAME` file containing exactly:
   ```
   mae-mcgill.ca
   ```
2. DNS at your registrar:
   - **Apex** `mae-mcgill.ca` — four `A` records: `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`
   - **www** `www.mae-mcgill.ca` — `CNAME` → `oslal-mcgill.github.io`
3. **Settings → Pages**, enter the domain, then tick **Enforce HTTPS** once provisioned.

## Editing content

### Add or remove students
`script.js`, `STUDENTS` array. The site re-renders automatically.

### Assign students to rooms (Exhibition page)
`script.js`, `ROOMS` array. Each room looks like:
```js
{ id: "101", name: "Room 101", plan: null, students: [] }
```
Drop names into a room's `students` array. Order in the array becomes the on-page numbered order. As soon as a name is in a room, it's removed from the bottom "unassigned" list automatically — no double-edit.

### Add a key plan to a room
Drop the image in `assets/plans/`, e.g. `assets/plans/101.png`, and point to it:
```js
{ id: "101", name: "Room 101", plan: "assets/plans/101.png", students: [...] }
```
The placeholder card swaps out for the image.

### Add the U3 / second-floor section
When U3 details are ready, edit the `<section id="exhibition">` block in `index.html` — the U3 group is currently a placeholder paragraph.

### Sponsors (home page)
`<div class="sponsors">` in `index.html`. Replace each `<div class="sponsor-slot">…</div>` placeholder with a real `<img>`:
```html
<img class="sponsor-slot" src="assets/sponsors/canada-council.png" alt="Canada Council for the Arts">
```
Drop logo files into `assets/sponsors/` (or wherever) — black/grayscale logos look best on a white background.

If you have one composite sponsor poster image, you can replace the whole `.sponsors__logos` flex container with a single `<img>` instead.

### Header / footer / address / date / Instagram
All hard-coded in `index.html` — `<header class="header">` and `<footer class="foot">`. Plain text, change in place.

### Typography
`styles.css`, top:
```css
--track: -0.04em;   /* tracking applied to every element */
```
Tighter? Drop to `-0.05em` or `-0.06em`. Looser? `-0.025em`.

Helvetica Neue is enforced on `*`, with `font-weight: 400` and `font-style: normal` locked across headings, buttons, and form elements. No bold or italic should ever leak in.

## Notes

- **The cursor dot** sits above all UI (`z-index: 9999`) and trails the mouse with easing. It's hidden on touch devices.
- **Section URLs** use hash routing (`#exhibition`, `#information`). Browser back/forward works.
- **Room cards** are not links — clicking them does nothing on purpose. If you later want each to open a per-room page, change the `<article>` to an `<a href>` in `script.js`'s `renderRooms`.
