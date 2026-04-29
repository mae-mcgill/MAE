/* =========================================================
   MAE 2026 — interactions
   - Section switching (home / exhibition / projects / information)
   - Sub-routing for individual project pages: #project/oscar-lallier
   - Auto-discovery of all assets
   - Room assignments fetched from assets/rooms.txt at boot
   - Scroll restored to top on every navigation
   ========================================================= */


/* =========================================================
   STUDENTS  ·  master M2 list (just names)
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


/* =========================================================
   ROOMS  ·  metadata. Student lists populated from rooms.txt.
   ========================================================= */

const ROOMS = [
  { id: "101", name: "Room 101", floor: "m2", students: [] },
  { id: "102", name: "Room 102", floor: "m2", students: [] },
  { id: "114", name: "Room 114", floor: "m2", students: [] },
  { id: "312", name: "Room 312", floor: "u3", students: [] },
];


/* =========================================================
   Asset paths
   ========================================================= */

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
  return room ? room.name : null;
}

const STUDENT_BY_SLUG = Object.fromEntries(
  STUDENTS.map(name => [slugify(name), name])
);

const STUDENT_SET = new Set(STUDENTS);


/* =========================================================
   Easter egg state — temporary "M2" card on the projects grid
   when a user clicks Projects while already on Projects list.
   Resets on any navigation away from the projects list view.
   ========================================================= */

let projectsEasterEgg = false;
let _renderedWithEasterEgg = false;


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
        console.warn(
          `rooms.txt: names not in STUDENTS list (typo?): ${unknown.join(", ")}`
        );
      }
      room.students = names;
    }
  } catch (e) {
    console.warn("rooms.txt not loaded — using empty room lists.", e);
  }
}


/* =========================================================
   organizers.txt parser
   ---------------------------------------------------------
   Format:
     # comments allowed
     Curation:
     Jane Doe
     John Smith

     Web design:
     Oscar Lallier
   Returns [{ role: "Curation", names: [...] }, ...]
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
   Project text parser (per-student .txt file)
   ========================================================= */

const projectTextCache = {};

async function fetchProjectText(slug) {
  if (slug in projectTextCache) return projectTextCache[slug];

  try {
    const res = await fetch(`${PATHS.text.dir}/${slug}.${PATHS.text.ext}`, { cache: "no-cache" });
    if (!res.ok) throw new Error("not found");
    const raw = await res.text();
    const parsed = parseProjectText(raw);
    projectTextCache[slug] = parsed;
    return parsed;
  } catch {
    projectTextCache[slug] = null;
    return null;
  }
}

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


/* =========================================================
   Section switching + sub-routing
   ========================================================= */

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");

const projectsListMount  = document.querySelector("[data-projects-list]");
const projectDetailMount = document.querySelector("[data-project-detail]");

function scrollTop() {
  // Always reset to top after a route change
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function setActiveSection(id) {
  sections.forEach(s => s.classList.toggle("active", s.id === id));
  navLinks.forEach(a => a.classList.toggle("is-active", a.dataset.target === id));
  scrollTop();
}

function showProjectsList() {
  setActiveSection("projects");
  projectsListMount.style.display  = "";
  projectDetailMount.style.display = "none";

  // If the rendered grid doesn't match the current easter egg state,
  // re-render. (Avoids a flash when the state hasn't changed.)
  if (_renderedWithEasterEgg !== projectsEasterEgg) {
    renderProjectsGrid();
  }

  document.title = "Projects · MAE · McGill Architecture Exhibition · 2026";
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

function route() {
  const raw = (location.hash || "#home").slice(1) || "home";

  // Easter egg: only persist while we're staying on the projects LIST.
  // Detail pages (project/...) and any other section reset it.
  if (raw !== "projects") projectsEasterEgg = false;

  if (raw.startsWith("project/")) {
    const slug = raw.split("/")[1] || "";
    showProjectDetail(slug);
    return;
  }

  if (!document.getElementById(raw)) {
    setActiveSection("home");
    document.title = "MAE · McGill Architecture Exhibition · 2026";
    return;
  }

  if (raw === "projects") {
    showProjectsList();
  } else {
    setActiveSection(raw);
  }

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
    // Easter egg: clicking the Projects nav while already on the projects
    // LIST view (not detail view) appends a temporary M2 card at the end.
    if (
      targetHash === "#projects" &&
      !projectsEasterEgg &&
      projectsListMount.style.display !== "none"
    ) {
      projectsEasterEgg = true;
      renderProjectsGrid();
      // Smoothly scroll the new M2 card into view so the egg is visible.
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
   Render Exhibition rooms — continuous numbering across rooms.
   We pre-compute each student's global index and pass it via
   a CSS custom property so the counter starts at the right
   number for each room.
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
      <div class="room-card__plan">
        <span class="room-card__plan-placeholder">Key plan — coming soon</span>
        <img class="room-card__plan-img" data-plan="${escapeHTML(room.id)}" alt="Key plan for ${escapeHTML(room.name)}">
      </div>
      ${listHTML}
    </article>
  `;
}

function renderExhibition() {
  const mount = document.querySelector("[data-exhibition-mount]");
  if (!mount) return;

  // Walk rooms in display order (M2 first, U3 last), accumulating count
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
   Render Projects grid
   ========================================================= */

function renderProjectsGrid() {
  const grid = document.querySelector("[data-projects-grid]");
  if (!grid) return;

  const sorted = [...STUDENTS].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

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

  // Easter egg: append a temporary, non-clickable "M2" card at the end.
  // The face image is expected at assets/faces/M2.png (case-sensitive).
  if (projectsEasterEgg) {
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

  // M2 face is a special-cased filename (capital "M2") so it's loaded directly.
  const easterImg = grid.querySelector("[data-face-easter]");
  if (easterImg) autoLoadImage(easterImg, `${PATHS.faces.dir}/M2`, PATHS.faces.exts);

  _renderedWithEasterEgg = projectsEasterEgg;
}


/* =========================================================
   Render Project detail (single student page)
   ========================================================= */

function fact(label, value, pending) {
  const cls = pending
    ? "project-detail__fact-value project-detail__fact-value--pending"
    : "project-detail__fact-value";
  return `
    <div data-fact="${escapeHTML(label.toLowerCase())}">
      <span class="project-detail__fact-label">${escapeHTML(label)}</span>
      <span class="${cls}">${escapeHTML(value)}</span>
    </div>
  `;
}

function renderProjectDetailSkeleton(name) {
  const room = findRoomForStudent(name);

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
            ${fact("Room",    room      || "TBA",         !room)}
            ${fact("Advisor", "Coming soon",              true)}
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
        <span class="project-detail__fact-value">${escapeHTML(data.advisor)}</span>
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
   Bootstrap — load rooms.txt FIRST, then render everything
   ========================================================= */

async function bootstrap() {
  // Disable browser scroll restoration so we control it
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // Kick off the master key plan load — it's not blocking, runs in parallel.
  const masterPlanImg = document.querySelector("[data-master-plan]");
  if (masterPlanImg) {
    autoLoadImage(masterPlanImg, `${PATHS.plans.dir}/master-key-plan`, PATHS.plans.exts);
  }

  // Load text files in parallel.
  const [, organizers] = await Promise.all([
    loadRoomsTxt(),
    loadOrganizersTxt(),
  ]);

  renderExhibition();
  renderProjectsGrid();
  renderOrganizers(organizers);
  route();
}

bootstrap();


/* =========================================================
   Cursor-following dot
   ========================================================= */

const circle = document.querySelector(".circle-cursor");
let target = { x: 0, y: 0 };
let pos    = { x: 0, y: 0 };
let seen   = false;

document.addEventListener("mousemove", e => {
  target.x = e.clientX;
  target.y = e.clientY;

  if (!seen) {
    pos.x = target.x;
    pos.y = target.y;
    circle.classList.add("is-visible");
    seen = true;
  }
});

document.addEventListener("mouseleave", () => circle.classList.remove("is-visible"));
document.addEventListener("mouseenter", () => { if (seen) circle.classList.add("is-visible"); });

function tick() {
  pos.x += (target.x - pos.x) * 0.18;
  pos.y += (target.y - pos.y) * 0.18;
  circle.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  requestAnimationFrame(tick);
}
tick();
