/* =========================================================
   MAE 2026 — interactions
   - Section switching (home / exhibition / projects / information)
   - Sub-routing for individual project pages: #project/oscar-lallier
   - Auto-discovery of all assets (faces, plans, project images, project text)
   - Linked student names under M2 room cards (U3 names not linked)
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
   ROOMS  ·  exhibition layout
   ---------------------------------------------------------
   Listed alphabetically by first name within each room.
   ========================================================= */

const ROOMS = [
  {
    id: "101",
    name: "Room 101",
    floor: "m2",
    students: [
      "Bethany Wakelin",
      "Jessica Villarasa",
      "Karine Payette",
      "Mallory Kerr",
      "Qiqi Liu",
      "Sarah Delnour",
      "Téa Canton",
    ],
  },
  {
    id: "102",
    name: "Room 102",
    floor: "m2",
    students: [
      "Bianca Hacker",
      "Félix Bergeron",
      "Gaël Haddad",
      "Nicolea Apostolidis",
      "Serena Valles",
    ],
  },
  {
    id: "114",
    name: "Room 114",
    floor: "m2",
    students: [
      "Albane Queinnec-Barreau",
      "Albert Assy",
      "Alyssa Pangilinan",
      "Anastasia Cubasova",
      "Antoine Kirouac",
      "Audrey Boutot",
      "Bronwyn Bell",
      "Dharshini Mahesh Babu",
      "Eliza Mihali",
      "Ishaan Anand",
      "Jacob Haley",
      "Jérémy Turbide",
      "Lucas Azar",
      "Ludovic Amyot",
      "Maria Jose Nolasco Ordonez",
      "Nicholas Santoianni",
      "Oscar Lallier",
      "Sean Wolanyk",
      "Suehayla Eljaji",
      "Sunny Lan",
      "Victoria Fratipietro",
    ],
  },

  // U3 — third floor (no names yet)
  { id: "312", name: "Room 312", floor: "u3", students: [] },
];


/* =========================================================
   Asset paths and accepted extensions
   ========================================================= */

const PATHS = {
  faces:        { dir: "assets/faces",          exts: ["png", "jpg", "jpeg", "webp"] },
  projectImage: { dir: "assets/project-images", exts: ["jpg", "jpeg", "png", "webp"] },
  plans:        { dir: "assets/plans",          exts: ["png", "jpg", "jpeg"] },
  text:         { dir: "assets/project-texts",  ext:  "txt" },
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
   Project text-file parsing
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

function setActiveSection(id) {
  sections.forEach(s => s.classList.toggle("active", s.id === id));
  navLinks.forEach(a => a.classList.toggle("is-active", a.dataset.target === id));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function showProjectsList() {
  setActiveSection("projects");
  projectsListMount.style.display  = "";
  projectDetailMount.style.display = "none";
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
    route();
  } else {
    history.pushState(null, "", targetHash || location.pathname);
    route();
  }
});

window.addEventListener("popstate", route);
window.addEventListener("hashchange", route);

route();   // initial load


/* =========================================================
   Render Exhibition rooms
   ---------------------------------------------------------
   M2 rooms: student names link to their project page.
   U3:       no links (no project pages exist for U3).
   ========================================================= */

function renderRoomCard(room) {
  const linkStudents = room.floor !== "u3";

  const listHTML = room.students.length
    ? `<ol class="room-card__list">${
        room.students.map(s => {
          const safe = escapeHTML(s);
          return linkStudents
            ? `<li><a href="#project/${slugify(s)}">${safe}</a></li>`
            : `<li><span>${safe}</span></li>`;
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

document.querySelectorAll("[data-rooms-mount]").forEach(mount => {
  const floor = mount.dataset.floor;
  const rooms = ROOMS.filter(r => r.floor === floor);
  mount.innerHTML = rooms.map(renderRoomCard).join("");
});

document.querySelectorAll("[data-plan]").forEach(img => {
  const id = img.dataset.plan;
  autoLoadImage(img, `${PATHS.plans.dir}/${id}`, PATHS.plans.exts);
});


/* =========================================================
   Render Projects grid
   ========================================================= */

const projectsGrid = document.querySelector("[data-projects-grid]");

function renderProjectsGrid() {
  const sorted = [...STUDENTS].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  projectsGrid.innerHTML = sorted.map(name => {
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
  }).join("");

  projectsGrid.querySelectorAll("[data-face]").forEach(img => {
    const slug = img.dataset.face;
    autoLoadImage(img, `${PATHS.faces.dir}/${slug}`, PATHS.faces.exts);
  });
}

renderProjectsGrid();


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
  // Face image — top right of the head
  const faceImg = projectDetailMount.querySelector('[data-slot="face"]');
  if (faceImg) autoLoadImage(faceImg, `${PATHS.faces.dir}/${slug}`, PATHS.faces.exts);

  // Project hero image
  const img = projectDetailMount.querySelector('[data-slot="image"]');
  if (img) autoLoadImage(img, `${PATHS.projectImage.dir}/${slug}`, PATHS.projectImage.exts);

  // Text data file
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
