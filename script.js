/* =========================================================
   MAE 2026 — interactions
   - Section switching (home / exhibition / projects / information)
   - Sub-routes:
       #project/<slug>            individual student page
       #projects/advisor/<slug>   projects filtered by advisor
       #room/<id>                  full-page room view
   - Auto-discovery of all assets
   - Room assignments fetched from rooms.txt at boot
   - Advisor index built from project-texts at boot
   ========================================================= */


/* =========================================================
   STUDENTS  ·  master list (just names)
   ========================================================= */

const STUDENTS = [
  "Albane Queinnec-Barreau",
  "Albert Assy",
  "Alyssa Pangilinan",
  "Anastasia Cubasova",
  "Antoine Kirouac",
  "Audrey Boutot",
  "Bethany Wakelin",
  "Bianca Hacker",
  "Bronwyn Bell",
  "Dharshini Mahesh Babu",
  "Eliza Mihali",
  "Félix Bergeron",
  "Gaël Haddad",
  "Ishaan Anand",
  "Jacob Haley",
  "Jérémy Turbide",
  "Jessica Villarasa",
  "Karine Payette",
  "Lucas Azar",
  "Ludovic Amyot",
  "Mallory Kerr",
  "Maria Jose Nolasco Ordonez",
  "Nicholas Santoianni",
  "Nicolea Apostolidis",
  "Oscar Lallier",
  "Qiqi Liu",
  "Sarah Delnour",
  "Sean Wolanyk",
  "Serena Valles",
  "Suehayla Eljaji",
  "Sunny Lan",
  "Téa Canton",
  "Victoria Fratipietro",
];

const ROOMS = [
  { id: "101", name: "Room 101", floor: "m2", students: [] },
  { id: "102", name: "Room 102", floor: "m2", students: [] },
  { id: "114", name: "Room 114", floor: "m2", students: [] },
  { id: "312", name: "Room 312", floor: "u3", students: [] },
];

const PATHS = {
  faces:        { dir: "assets/faces",          exts: ["png", "jpg", "jpeg", "webp"] },
  projectImage: { dir: "assets/project-images", exts: ["jpg", "jpeg", "png", "webp"] },
  plans:        { dir: "assets/plans",          exts: ["png", "jpg", "jpeg"] },
  text:         { dir: "assets/project-texts",  ext:  "txt" },
  rooms:        "assets/text-files/rooms.txt",
  organizers:   "assets/text-files/organizers.txt",
};


/* =========================================================
   Helpers
   ========================================================= */

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initials(name) {
  return name
    .split(/\s+/)
    .map(w => w[0] || "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function findRoomForStudent(name) {
  const room = ROOMS.find(r => r.students.includes(name));
  return room || null;
}

function nameSort(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/* Sort by FIRST name (default localeCompare on "Bianca Hacker" works:
   "B" < "F" so Bianca < Félix; for "Félix" the accent is folded). */
function firstNameSort(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

const STUDENT_BY_SLUG = Object.fromEntries(
  STUDENTS.map(name => [slugify(name), name])
);

const STUDENT_SET = new Set(STUDENTS);


/* =========================================================
   Advisor index — built at boot from per-student .txt files
   ---------------------------------------------------------
   Maps:
     ADVISOR_BY_STUDENT[name]   = "Michael Jemtrud" | null
     STUDENTS_BY_ADVISOR[slug]  = ["Oscar Lallier", "Albert Assy", ...]
     ADVISOR_NAME_BY_SLUG[slug] = "Michael Jemtrud"
   ========================================================= */

const ADVISOR_BY_STUDENT   = {};
const STUDENTS_BY_ADVISOR  = {};
const ADVISOR_NAME_BY_SLUG = {};


/* =========================================================
   Easter egg state
   ========================================================= */

let projectsEasterEgg = false;
let _renderedWithEasterEgg = false;

/* Track currently-active advisor filter ('' = none / "all") */
let activeAdvisorSlug = "";


/* =========================================================
   Image auto-discovery
   ========================================================= */

function autoLoadImage(img, basePath, exts) {
  let i = 0;
  function loadNext() {
    if (i >= exts.length) { img.remove(); return; }
    img.src = `${basePath}.${exts[i]}`;
    i++;
  }
  img.addEventListener("load",  () => img.classList.add("is-loaded"));
  img.addEventListener("error", loadNext);
  loadNext();
}


/* =========================================================
   rooms.txt parser
   ========================================================= */

function parseRoomsTxt(raw) {
  const result = {};
  let currentId = null;

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;

    const m = trimmed.match(/^ROOM\s+(\S+)$/i);
    if (m) {
      currentId = m[1];
      if (!result[currentId]) result[currentId] = [];
      continue;
    }

    if (currentId) result[currentId].push(trimmed);
  }
  return result;
}

async function loadRoomsTxt() {
  try {
    const res = await fetch(PATHS.rooms, { cache: "no-cache" });
    if (!res.ok) return;

    const parsed = parseRoomsTxt(await res.text());

    for (const [roomId, names] of Object.entries(parsed)) {
      const room = ROOMS.find(r => r.id === roomId);
      if (!room) {
        console.warn(`rooms.txt references unknown room "${roomId}" — ignored.`);
        continue;
      }

      const unknown = names.filter(n => !STUDENT_SET.has(n));
      if (unknown.length) {
        console.warn(`rooms.txt: names not in STUDENTS list (typo?): ${unknown.join(", ")}`);
      }
      room.students = names;
    }
  } catch (e) {
    console.warn("rooms.txt not loaded — using empty room lists.", e);
  }
}


/* =========================================================
   organizers.txt parser
   ========================================================= */

function parseOrganizersTxt(raw) {
  const sections = [];
  let current = null;

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;

    if (trimmed.endsWith(":")) {
      current = { role: trimmed.slice(0, -1).trim(), names: [] };
      sections.push(current);
    } else if (current) {
      current.names.push(trimmed);
    }
  }
  return sections;
}

async function loadOrganizersTxt() {
  try {
    const res = await fetch(PATHS.organizers, { cache: "no-cache" });
    if (!res.ok) return [];
    return parseOrganizersTxt(await res.text());
  } catch {
    return [];
  }
}

function renderOrganizers(sections) {
  const mount = document.querySelector("[data-organizers-mount]");
  if (!mount) return;

  if (!sections.length) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = `
    <h2 class="info-organizers__heading">Organizers &amp; contributors</h2>
    <div class="info-organizers__grid">
      ${sections.map(s => `
        <div class="info-organizers__group">
          <span class="info-organizers__label">${escapeHTML(s.role)}</span>
          ${s.names.map(n => `<span class="info-organizers__name">${escapeHTML(n)}</span>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}


/* =========================================================
   Project text parser & loader
   ========================================================= */

const projectTextCache = {};

function parseProjectText(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let split = lines.findIndex(l => l.trim() === "");
  if (split < 0) split = lines.length;

  const headerLines = lines.slice(0, split);
  const bodyLines   = lines.slice(split + 1);

  const meta = {};
  for (const line of headerLines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }

  return {
    title:   meta.title   || null,
    advisor: meta.advisor || null,
    text:    bodyLines.join("\n").trim() || null,
  };
}

async function fetchProjectText(slug) {
  if (slug in projectTextCache) return projectTextCache[slug];

  try {
    const res = await fetch(`${PATHS.text.dir}/${slug}.${PATHS.text.ext}`, { cache: "no-cache" });
    if (!res.ok) throw new Error("not found");
    const parsed = parseProjectText(await res.text());
    projectTextCache[slug] = parsed;
    return parsed;
  } catch {
    projectTextCache[slug] = null;
    return null;
  }
}

/* Pre-fetches every student's text file to build the advisor index.
   Failures are silent — students without text just don't get an advisor. */
async function buildAdvisorIndex() {
  const fetches = STUDENTS.map(async (name) => {
    const slug = slugify(name);
    const data = await fetchProjectText(slug);
    if (data && data.advisor) {
      const advisor = data.advisor;
      const advSlug = slugify(advisor);
      ADVISOR_BY_STUDENT[name] = advisor;
      ADVISOR_NAME_BY_SLUG[advSlug] = advisor;
      if (!STUDENTS_BY_ADVISOR[advSlug]) STUDENTS_BY_ADVISOR[advSlug] = [];
      STUDENTS_BY_ADVISOR[advSlug].push(name);
    } else {
      ADVISOR_BY_STUDENT[name] = null;
    }
  });

  await Promise.all(fetches);
}


/* =========================================================
   Routing
   ---------------------------------------------------------
   Hash schemes handled:
     ""                          → home
     "home" / "exhibition" /
       "projects" / "information" → top-level sections
     "project/<slug>"            → student detail page
     "projects/advisor/<slug>"   → projects filtered by advisor
     "room/<id>"                 → full-page room view
   ========================================================= */

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");

const projectsListMount  = document.querySelector("[data-projects-list]");
const projectDetailMount = document.querySelector("[data-project-detail]");
const roomMount          = document.querySelector("[data-room-mount]");

function scrollTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function setActiveSection(id) {
  sections.forEach(s => s.classList.toggle("active", s.id === id));

  // Header nav highlights — "Exhibition" lights up when on a room page too
  const navTarget =
    id === "room" ? "exhibition" :
    id === "information" ? "information" :
    id;

  navLinks.forEach(a => a.classList.toggle("is-active", a.dataset.target === navTarget));
  scrollTop();
}

function showProjectsList() {
  setActiveSection("projects");
  projectsListMount.style.display  = "";
  projectDetailMount.style.display = "none";

  // Re-render if grid is out-of-date (easter egg or filter changed)
  renderProjectsGrid();
  renderAdvisorFilter();

  document.title = activeAdvisorSlug
    ? `Projects — ${ADVISOR_NAME_BY_SLUG[activeAdvisorSlug] || "filter"} · MAE`
    : "Projects · MAE · McGill Architecture Exhibition · 2026";
}

function showProjectDetail(slug) {
  const name = STUDENT_BY_SLUG[slug];
  if (!name) {
    location.hash = "#projects";
    return;
  }

  setActiveSection("projects");
  projectsListMount.style.display  = "none";
  projectDetailMount.style.display = "";

  projectDetailMount.innerHTML = renderProjectDetailSkeleton(name);
  hydrateProjectDetail(slug, name);

  document.title = `${name} · MAE 2026`;
}

function showRoomPage(id) {
  const room = ROOMS.find(r => r.id === id);
  if (!room) {
    location.hash = "#exhibition";
    return;
  }
  setActiveSection("room");
  renderRoomPage(room);
  document.title = `${room.name} · MAE 2026`;
}

function route() {
  const raw = (location.hash || "#home").slice(1) || "home";

  // Reset easter egg whenever leaving the projects list view
  if (!raw.startsWith("projects") && raw !== "projects") projectsEasterEgg = false;

  // #project/<slug>
  if (raw.startsWith("project/")) {
    const slug = raw.split("/")[1] || "";
    showProjectDetail(slug);
    return;
  }

  // #projects/advisor/<slug>
  if (raw.startsWith("projects/advisor/")) {
    activeAdvisorSlug = raw.split("/")[2] || "";
    showProjectsList();
    return;
  }

  // #room/<id>
  if (raw.startsWith("room/")) {
    const id = raw.split("/")[1] || "";
    showRoomPage(id);
    return;
  }

  // Plain #projects → clear filter and show list
  if (raw === "projects") {
    activeAdvisorSlug = "";
    showProjectsList();
    return;
  }

  // Other top-level routes
  if (!document.getElementById(raw)) {
    setActiveSection("home");
    document.title = "MAE · McGill Architecture Exhibition · 2026";
    return;
  }

  setActiveSection(raw);

  if (raw === "home")        document.title = "MAE · McGill Architecture Exhibition · 2026";
  if (raw === "exhibition")  document.title = "Exhibition · MAE · McGill Architecture Exhibition · 2026";
  if (raw === "information") document.title = "Information · MAE · McGill Architecture Exhibition · 2026";
}

document.addEventListener("click", e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  if (link.target === "_blank") return;

  const newHash = link.getAttribute("href");
  e.preventDefault();

  const wantHome = link.dataset.target === "home" || newHash === "#home";
  const targetHash = wantHome ? "" : newHash;

  if (location.hash === targetHash || (wantHome && !location.hash)) {
    // Easter egg trigger: clicking Projects nav while already on the
    // projects LIST view (no filter, no detail) appends an M2 card.
    if (
      targetHash === "#projects" &&
      !projectsEasterEgg &&
      projectsListMount.style.display !== "none" &&
      !activeAdvisorSlug
    ) {
      projectsEasterEgg = true;
      renderProjectsGrid();
      requestAnimationFrame(() => {
        const m2 = document.querySelector(".project-card--easter");
        if (m2) m2.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    route();
  } else {
    history.pushState(null, "", targetHash || location.pathname);
    route();
  }
});

window.addEventListener("popstate", route);
window.addEventListener("hashchange", route);


/* =========================================================
   Render Exhibition rooms (single 4-col grid)
   ---------------------------------------------------------
   The plan thumbnail is now a link to the full room page.
   Continuous numbering across rooms (101 starts at 1, 102
   continues, etc.).
   ========================================================= */

function renderRoomCard(room, startIndex) {
  const linkStudents = room.floor !== "u3";

  const listHTML = room.students.length
    ? `<ol class="room-card__list">${
        room.students.map((s, i) => {
          const safe = escapeHTML(s);
          const num  = startIndex + i;
          const inner = linkStudents
            ? `<a href="#project/${slugify(s)}">${safe}</a>`
            : `<span>${safe}</span>`;
          return `<li><span class="room-card__list__num">${num}.</span>${inner}</li>`;
        }).join("")
      }</ol>`
    : `<p class="room-card__pending">Names coming soon.</p>`;

  return `
    <article class="room-card" data-room="${escapeHTML(room.id)}">
      <h3 class="room-card__title">${escapeHTML(room.name)}</h3>
      <a class="room-card__plan-link" href="#room/${escapeHTML(room.id)}" aria-label="Open ${escapeHTML(room.name)} page">
        <div class="room-card__plan">
          <span class="room-card__plan-placeholder">Key plan — coming soon</span>
          <img class="room-card__plan-img" data-plan="${escapeHTML(room.id)}" alt="Key plan for ${escapeHTML(room.name)}">
        </div>
      </a>
      ${listHTML}
    </article>
  `;
}

function renderExhibition() {
  const mount = document.querySelector("[data-exhibition-mount]");
  if (!mount) return;

  const displayOrder = [
    ...ROOMS.filter(r => r.floor === "m2"),
    ...ROOMS.filter(r => r.floor === "u3"),
  ];

  let counter = 1;
  const cards = displayOrder.map(room => {
    const html = renderRoomCard(room, counter);
    counter += room.students.length;
    return { room, html };
  });

  const m2Cards = cards.filter(c => c.room.floor === "m2").map(c => c.html).join("");
  const u3Cards = cards.filter(c => c.room.floor === "u3").map(c => c.html).join("");

  mount.innerHTML = `
    <h2 class="group__label exhibition-grid__floor--m2">M2, First floor</h2>
    <h2 class="group__label exhibition-grid__floor--u3">U3, Third floor</h2>
    ${m2Cards}
    ${u3Cards}
  `;

  mount.querySelectorAll("[data-plan]").forEach(img => {
    const id = img.dataset.plan;
    autoLoadImage(img, `${PATHS.plans.dir}/${id}`, PATHS.plans.exts);
  });
}


/* =========================================================
   Render full Room page  (#room/<id>)
   ---------------------------------------------------------
   - Big title (room name)
   - Big key plan image (assets/plans/<id>-page.png, falls back to <id>.png)
   - Roster of students alphabetical by first name, with advisor.
     Student name links to project page; advisor links to filtered list.
     U3 students aren't linked (no project pages).
   ========================================================= */

function renderRoomPage(room) {
  const linkStudents = room.floor !== "u3";

  // Sort alphabetically by first name; preserve original room
  // membership but display in order.
  const students = [...room.students].sort(firstNameSort);

  const rosterHTML = students.length ? students.map((name, i) => {
    const advisor = ADVISOR_BY_STUDENT[name] || null;
    const advisorHTML = advisor
      ? `<a class="room-page__advisor" href="#projects/advisor/${slugify(advisor)}">${escapeHTML(advisor)}</a>`
      : `<span class="room-page__advisor room-page__advisor--pending">Coming soon</span>`;

    const studentHTML = linkStudents
      ? `<a class="room-page__student" href="#project/${slugify(name)}">${escapeHTML(name)}</a>`
      : `<span class="room-page__student">${escapeHTML(name)}</span>`;

    return `
      <div class="room-page__roster-row">
        <span class="room-page__num">${i + 1}.</span>
        ${studentHTML}
        <div class="room-page__advisor-wrap">
          <span class="room-page__advisor-label">Advisor</span>
          ${advisorHTML}
        </div>
      </div>
    `;
  }).join("") : `<p class="room-card__pending">Names coming soon.</p>`;

  roomMount.innerHTML = `
    <div class="room-page">
      <a class="room-page__back" href="#exhibition">Back to exhibition</a>
      <h1 class="room-page__title">${escapeHTML(room.name)}</h1>
      <div class="room-page__plan">
        <span class="room-page__plan-placeholder">Key plan — coming soon</span>
        <img class="room-page__plan-img" data-room-plan="${escapeHTML(room.id)}" alt="Plan of ${escapeHTML(room.name)}">
      </div>
      <div class="room-page__roster">${rosterHTML}</div>
    </div>
  `;

  // Load the larger "<id>-page.png" image first; fall back to the
  // smaller "<id>.png" used on the exhibition card if no -page version.
  const planImg = roomMount.querySelector("[data-room-plan]");
  if (planImg) {
    const id = planImg.dataset.roomPlan;
    let attempts = [
      `${PATHS.plans.dir}/${id}-page`,
      `${PATHS.plans.dir}/${id}`,
    ];
    let attemptIdx = 0;

    function tryNextBase() {
      if (attemptIdx >= attempts.length) { planImg.remove(); return; }
      autoLoadImageWithFallback(planImg, attempts[attemptIdx], PATHS.plans.exts, () => {
        attemptIdx++;
        tryNextBase();
      });
    }
    tryNextBase();
  }
}

/* Variant of autoLoadImage that calls onAllFailed instead of removing
   the element when every extension has been tried unsuccessfully. */
function autoLoadImageWithFallback(img, basePath, exts, onAllFailed) {
  let i = 0;
  function loadNext() {
    if (i >= exts.length) { onAllFailed(); return; }
    img.src = `${basePath}.${exts[i]}`;
    i++;
  }
  // Remove any pre-existing handlers from a previous attempt
  img.onload = () => img.classList.add("is-loaded");
  img.onerror = loadNext;
  loadNext();
}


/* =========================================================
   Advisor filter bar (above the projects grid)
   ========================================================= */

function renderAdvisorFilter() {
  const mount = document.querySelector("[data-advisor-filter]");
  if (!mount) return;

  // Build sorted list of advisor slugs (by first name)
  const advisorSlugs = Object.keys(STUDENTS_BY_ADVISOR).sort((a, b) => {
    return firstNameSort(ADVISOR_NAME_BY_SLUG[a], ADVISOR_NAME_BY_SLUG[b]);
  });

  if (advisorSlugs.length === 0) {
    mount.innerHTML = "";
    return;
  }

  const allCls = `advisor-filter__chip${activeAdvisorSlug ? "" : " is-active"}`;
  const chips = [`<a class="${allCls}" href="#projects">All</a>`];

  for (const slug of advisorSlugs) {
    const cls = `advisor-filter__chip${activeAdvisorSlug === slug ? " is-active" : ""}`;
    chips.push(`<a class="${cls}" href="#projects/advisor/${slug}">${escapeHTML(ADVISOR_NAME_BY_SLUG[slug])}</a>`);
  }

  mount.innerHTML = chips.join("");
}


/* =========================================================
   Render Projects grid
   ========================================================= */

function renderProjectsGrid() {
  const grid = document.querySelector("[data-projects-grid]");
  if (!grid) return;

  // Determine which students to show
  let visibleStudents;
  if (activeAdvisorSlug) {
    visibleStudents = STUDENTS_BY_ADVISOR[activeAdvisorSlug] || [];
  } else {
    visibleStudents = STUDENTS;
  }

  const sorted = [...visibleStudents].sort(nameSort);

  if (sorted.length === 0) {
    grid.innerHTML = `<li class="projects-empty">No projects match this filter yet.</li>`;
    _renderedWithEasterEgg = false;
    return;
  }

  const items = sorted.map(name => {
    const slug = slugify(name);
    return `
      <li>
        <a class="project-card" href="#project/${slug}">
          <div class="project-card__face">
            <span class="project-card__face-placeholder">${escapeHTML(initials(name))}</span>
            <img class="project-card__face-img" data-face="${slug}" alt="" loading="lazy">
          </div>
          <span class="project-card__name">${escapeHTML(name)}</span>
        </a>
      </li>
    `;
  });

  // Easter egg only renders on the unfiltered ALL view
  if (projectsEasterEgg && !activeAdvisorSlug) {
    items.push(`
      <li>
        <div class="project-card project-card--easter" aria-label="M2 — every face combined">
          <div class="project-card__face">
            <span class="project-card__face-placeholder">M2</span>
            <img class="project-card__face-img" data-face-easter alt="" loading="lazy">
          </div>
          <span class="project-card__name">M2</span>
        </div>
      </li>
    `);
  }

  grid.innerHTML = items.join("");

  grid.querySelectorAll("[data-face]").forEach(img => {
    const slug = img.dataset.face;
    autoLoadImage(img, `${PATHS.faces.dir}/${slug}`, PATHS.faces.exts);
  });

  const easterImg = grid.querySelector("[data-face-easter]");
  if (easterImg) autoLoadImage(easterImg, `${PATHS.faces.dir}/M2`, PATHS.faces.exts);

  _renderedWithEasterEgg = projectsEasterEgg;
}


/* =========================================================
   Render Project detail
   ---------------------------------------------------------
   Room and advisor are now clickable links when known.
   ========================================================= */

function renderProjectDetailSkeleton(name) {
  const room = findRoomForStudent(name);

  // Room field (link if found)
  const roomFact = room
    ? `
      <div data-fact="room">
        <span class="project-detail__fact-label">Room</span>
        <a class="project-detail__fact-value" href="#room/${escapeHTML(room.id)}">${escapeHTML(room.name)}</a>
      </div>
    `
    : `
      <div data-fact="room">
        <span class="project-detail__fact-label">Room</span>
        <span class="project-detail__fact-value project-detail__fact-value--pending">TBA</span>
      </div>
    `;

  return `
    <div class="project-detail">
      <a class="project-back" href="#projects">Back to projects</a>

      <div class="project-detail__head">
        <div class="project-detail__head-text">
          <h1 class="project-detail__name">${escapeHTML(name)}</h1>
          <p class="project-detail__title project-detail__pending" data-slot="title">Project title — coming soon</p>
        </div>
        <div class="project-detail__face">
          <img class="project-detail__face-img" data-slot="face" alt="">
        </div>
      </div>

      <div class="project-detail__body">
        <div class="project-detail__image">
          <span class="project-detail__image-placeholder">Project image — coming soon</span>
          <img class="project-detail__image-img" data-slot="image" alt="">
        </div>
        <div class="project-detail__meta">
          <div class="project-detail__facts">
            ${roomFact}
            <div data-fact="advisor">
              <span class="project-detail__fact-label">Advisor</span>
              <span class="project-detail__fact-value project-detail__fact-value--pending">Coming soon</span>
            </div>
          </div>
          <div data-slot="text">
            <p class="project-detail__pending">Project description — coming soon (≈400 words).</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function hydrateProjectDetail(slug, name) {
  const faceImg = projectDetailMount.querySelector('[data-slot="face"]');
  if (faceImg) autoLoadImage(faceImg, `${PATHS.faces.dir}/${slug}`, PATHS.faces.exts);

  const img = projectDetailMount.querySelector('[data-slot="image"]');
  if (img) autoLoadImage(img, `${PATHS.projectImage.dir}/${slug}`, PATHS.projectImage.exts);

  const data = await fetchProjectText(slug);
  if (!data) return;

  if (data.title) {
    const t = projectDetailMount.querySelector('[data-slot="title"]');
    if (t) {
      t.textContent = data.title;
      t.classList.remove("project-detail__pending");
    }
  }

  if (data.advisor) {
    const advisorBlock = projectDetailMount.querySelector('[data-fact="advisor"]');
    if (advisorBlock) {
      advisorBlock.innerHTML = `
        <span class="project-detail__fact-label">Advisor</span>
        <a class="project-detail__fact-value" href="#projects/advisor/${slugify(data.advisor)}">${escapeHTML(data.advisor)}</a>
      `;
    }
  }

  if (data.text) {
    const textSlot = projectDetailMount.querySelector('[data-slot="text"]');
    if (textSlot) {
      const paras = data.text
        .split(/\n\s*\n/)
        .filter(p => p.trim())
        .map(p => `<p>${escapeHTML(p.trim())}</p>`)
        .join("");
      textSlot.innerHTML = `<div class="project-detail__text">${paras}</div>`;
    }
  }
}


/* =========================================================
   Bootstrap
   ========================================================= */

async function bootstrap() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // Master key plan loads in parallel
  const masterPlanImg = document.querySelector("[data-master-plan]");
  if (masterPlanImg) {
    autoLoadImage(masterPlanImg, `${PATHS.plans.dir}/master-key-plan`, PATHS.plans.exts);
  }

  // Load text files in parallel:
  //   rooms.txt, organizers.txt, AND every per-student .txt
  //   (the last so we can build the advisor index before first render)
  const [, organizers] = await Promise.all([
    loadRoomsTxt(),
    loadOrganizersTxt(),
    buildAdvisorIndex(),
  ]);

  renderExhibition();
  renderProjectsGrid();
  renderAdvisorFilter();
  renderOrganizers(organizers);
  route();
}

bootstrap();


/* =========================================================
   Cursor-following dot
   ========================================================= */

const circle = document.querySelector(".circle-cursor");
let cursorTarget = { x: 0, y: 0 };
let cursorPos    = { x: 0, y: 0 };
let cursorSeen   = false;

document.addEventListener("mousemove", e => {
  cursorTarget.x = e.clientX;
  cursorTarget.y = e.clientY;

  if (!cursorSeen) {
    cursorPos.x = cursorTarget.x;
    cursorPos.y = cursorTarget.y;
    circle.classList.add("is-visible");
    cursorSeen = true;
  }
});

document.addEventListener("mouseleave", () => circle.classList.remove("is-visible"));
document.addEventListener("mouseenter", () => { if (cursorSeen) circle.classList.add("is-visible"); });

function tick() {
  cursorPos.x += (cursorTarget.x - cursorPos.x) * 0.18;
  cursorPos.y += (cursorTarget.y - cursorPos.y) * 0.18;
  circle.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px) translate(-50%, -50%)`;
  requestAnimationFrame(tick);
}
tick();
