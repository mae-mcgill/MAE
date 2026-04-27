# MAE 2026

Static site for the **McGill Architecture Exhibition 2026**.
Live at: **https://mae-mcgill.github.io/MAE/** · target domain: **mae-mcgill.ca**

## Files

```
index.html               — the page (all sections in one HTML file)
styles.css               — typography (Helvetica Neue) + layout
script.js                — section switching, room renderer, projects renderer
README.md                — this file

assets/
  access-plan.png        — venue map shown on the Information page
  sponsors/              — sponsor logo PNGs (already populated)
  plans/                 — drop key-plan images here
  faces/                 — drop student portrait drawings here
  projects/              — drop project hero images here
```

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

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

## How student/project URLs work

Every M2 student gets their own URL automatically:

```
https://mae-mcgill.ca/#project/oscar-lallier
https://mae-mcgill.ca/#project/tea-canton
https://mae-mcgill.ca/#project/albane-queinnec-barreau
```

The slug (`oscar-lallier`) is generated automatically from the name — accents and capitals are normalized. To find a slug, take the student's name, lowercase it, strip accents, and replace spaces with hyphens.

These links are shareable. You can hand a student their direct URL.

---

## Where do I upload things?

### Sponsor logos → `assets/sponsors/`
Already wired up (9 logos). To add more or swap, drop the PNG in this folder and add an `<img class="sponsor-logo" …>` line to the `.sponsors__logos` block in `index.html`.

### Key plans → `assets/plans/`
Save plans as `assets/plans/101.png`, `102.png`, `114.png`, `312.png`. In `script.js`, set the `plan` field on the matching room:
```js
{ id: "101", name: "Room 101", floor: "m2", plan: "assets/plans/101.png", students: [...] }
```

### Student portraits → `assets/faces/`
Save each portrait as `assets/faces/<slug>.png` (e.g. `assets/faces/oscar-lallier.png`). In `script.js`, add the `face` field to that student:
```js
{ name: "Oscar Lallier", face: "assets/faces/oscar-lallier.png" }
```
Until set, the projects grid shows the student's initials as a placeholder.

### Project hero images → `assets/projects/`
Save as `assets/projects/<slug>.jpg` (or `.png`). In `script.js`, add the `image` field:
```js
{ name: "Oscar Lallier", image: "assets/projects/oscar-lallier.jpg" }
```

### Venue map (Information page)
Already wired. Replace the file at `assets/access-plan.png` to swap.

---

## Where do I update info?

Almost everything content-related lives in **two places**:

### `script.js` — the data file

#### **`STUDENTS`** (top of file)
The master list of M2 students. Each entry is one object:
```js
{
  name:    "Oscar Lallier",                       // required
  title:   "The Project Title",                   // optional
  advisor: "Advisor's Name",                      // optional
  text:    "Project description… (~400 words).",  // optional, supports paragraph breaks via blank lines
  face:    "assets/faces/oscar-lallier.png",      // optional
  image:   "assets/projects/oscar-lallier.jpg",   // optional
}
```
Add fields as info comes in. Anything missing shows a "coming soon" placeholder.

For multi-paragraph project text, use a JS template literal with blank lines between paragraphs:
```js
text: `First paragraph here.

Second paragraph here.

Third paragraph here.`,
```

#### **`ROOMS`**
Assigns students to rooms. Each room:
```js
{ id: "101", name: "Room 101", floor: "m2", plan: null, students: [] }
```
Drop names into `students` in the order you want them numbered on the page.
`floor` is `"m2"` (first floor) or `"u3"` (third floor) — controls which Exhibition group it appears under.

### `index.html` — everything else
- **Header / footer** text (address, dates, Instagram URL).
- **Home brochure paragraph** (`.home-paras`).
- **Sponsors thank-you line + logo `<img>` tags** (`.sponsors`).
- **Information page text + map** (`<section id="information">`).

### `styles.css` — visual tuning
Top of file:
```css
--track:        -0.04em;   /* letter-spacing everywhere */
--text:         #0a0a0a;
--text-muted:   #b8b8b8;
```
For the giant MAE logo size, search `.hero--home` and adjust the `30vw` in the clamp.

---

## Notes

- Section URLs use hash routing. Browser back/forward works.
- Subroutes for individual projects: `#project/<slug>`. The slug is auto-derived from the student's name.
- The cursor dot trails the mouse with easing on desktop, hidden on touch devices.
- Helvetica Neue is enforced on every element, weight 400 only, italic disabled.
