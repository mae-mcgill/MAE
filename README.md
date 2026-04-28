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
  access-plan.png                    — venue map (Information page)
  fonts/
    PPNeueMontreal-Regular.otf       — site typeface
  sponsors/                          — sponsor logo PNGs
  plans/                             — key-plan PNGs go here
  faces/                             — student portrait drawings go here
  projects/                          — project hero images go here
```

**Folder structure matters.** The HTML and JS reference files at specific paths. See "Uploading images" below for the exact rules.

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

## Uploading images — the rules

**Every file must live at the exact path the code expects.** GitHub does not "find" images by name — it only fetches them from the literal path.

### The expected paths

| What                     | Where it must live                                 |
|--------------------------|----------------------------------------------------|
| Sponsor logos            | `assets/sponsors/<filename>.png`                   |
| Key plans                | `assets/plans/<id>.png` (e.g. `101.png`)           |
| Student portraits        | `assets/faces/<slug>.png` (e.g. `oscar-lallier.png`) |
| Project hero images      | `assets/projects/<slug>.jpg`                       |
| Access plan              | `assets/access-plan.png`                           |
| Font                     | `assets/fonts/PPNeueMontreal-Regular.otf`          |

If a sponsor PNG is at the **root** of the repo (just `260424-MAE_SPONSORS-LOGOS_ASA.png`), the browser will try to fetch `assets/sponsors/260424-MAE_SPONSORS-LOGOS_ASA.png` and fail with a broken-image icon. The fix is to put it in the right folder.

### Uploading via the GitHub web UI (no command line needed)

The trick: GitHub's drag-and-drop uploader puts files **wherever you currently are** in the repo. So navigate INTO the folder first, then drop.

1. On the repo page, click the `assets` folder. (If it doesn't exist yet, see "Creating folders" below.)
2. Click `sponsors` (or whichever subfolder you need).
3. Click **Add file → Upload files**.
4. Drag your PNGs into the page, scroll down, "Commit changes."

### Creating folders that don't exist yet

GitHub doesn't have a "new folder" button. Workaround:

1. Click **Add file → Create new file**.
2. In the filename box, type the **full path** with slashes:
   ```
   assets/faces/.gitkeep
   ```
   The slashes create the folder tree on the way down.
3. Commit. The folder now exists and you can navigate into it and drag PNGs in.

### Drag-and-drop a whole folder (fastest)

1. On your computer, organise everything into a folder that mirrors the structure above.
2. On the repo's main page, click **Add file → Upload files**.
3. Drag the **entire `assets` folder** onto the upload area. GitHub preserves the subfolders.
4. Commit. Done in one shot.

---

## Where do I update info?

### `script.js` — student & room data

#### **`STUDENTS`** (top of the file)
```js
{
  name:    "Oscar Lallier",                       // required
  title:   "The Project Title",                   // optional
  advisor: "Advisor's Name",                      // optional
  text:    "Project description (≈400 words).",   // optional
  face:    "assets/faces/oscar-lallier.png",      // optional
  image:   "assets/projects/oscar-lallier.jpg",   // optional
}
```
Anything missing shows a "coming soon" placeholder on that student's page.

For **multi-paragraph project text**, write it as a backtick template literal with blank lines between paragraphs:
```js
text: `First paragraph.

Second paragraph.

Third paragraph.`,
```

#### **`ROOMS`**
```js
{ id: "101", name: "Room 101", floor: "m2", plan: null, students: [] }
```
Add names into `students` in the order you want them numbered on the room card.
Once a student is in a room, their individual project page will automatically display the room name (no duplicate work).

`floor` is `"m2"` (first floor) or `"u3"` (third floor).

### `index.html` — text on the page
- Header / footer text (address, dates, Instagram URL).
- Home brochure paragraph (`.home-paras`).
- Sponsors thank-you line + the 9 logo `<img>` tags (`.sponsors`).
- Information page text + map (`<section id="information">`).

### `styles.css` — visual tuning
Top of file:
```css
--track:        -0.04em;   /* letter-spacing everywhere */
--text:         #0a0a0a;
--text-muted:   #b8b8b8;
```
For the giant MAE logo size on the home page, search `.hero--home` and adjust the `30vw` value.

---

## Notes

- **Typeface** is PP Neue Montreal Regular (self-hosted from `assets/fonts/`). The `@font-face` rule in `styles.css` declares it; the body uses it via `--font`. If the file is missing the page falls back to Helvetica Neue → Helvetica → Arial automatically.
- Section URLs use hash routing (`#exhibition`, `#projects`). Subroutes for individual projects are `#project/<slug>`. The slug is auto-derived from the student's name.
- The cursor dot trails the mouse on desktop, hidden on touch devices.
