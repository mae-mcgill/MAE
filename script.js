/* =========================================================
   MAE 2026 — interactions
   - Section switching (home / exhibition / projects / information)
   - Sub-routing for individual project pages: #project/oscar-lallier
   - Renders Exhibition rooms by floor (M2 first, U3 third)
   - Renders the Projects grid + the per-student detail view
   - Cursor-following solid black dot (desktop only)
   ========================================================= */


/* =========================================================
   STUDENT + PROJECT DATA
   =========================================================
   Each entry needs at minimum a `name`. Optional fields:

     title     — the project title         (string)
     advisor   — name of advisor           (string)
     text      — project description       (string, ~400 words)
     image     — path to project image     (e.g. "assets/projects/oscar-lallier.jpg")
     face      — path to portrait drawing  (e.g. "assets/faces/oscar-lallier.png")

   The room a student is in is taken from the ROOMS array below — no
   need to set it on the student.
   ========================================================= */

const STUDENTS = [
  { name: "Albane Queinnec-Barreau" },
  { name: "Albert Assy" },
  { name: "Alyssa Pangilinan" },
  { name: "Anastasia Cubasova" },
  { name: "Antoine Kirouac" },
  { name: "Audrey Boutot" },
  { name: "Bethany Wakelin" },
  { name: "Bianca Hacker" },
  { name: "Bronwyn Bell" },
  { name: "Dharshini Mahesh Babu" },
  { name: "Eliza Mihali" },
  { name: "Félix Bergeron" },
  { name: "Gaël Haddad" },
  { name: "Ishaan Anand" },
  { name: "Jacob Haley" },
  { name: "Jérémy Turbide" },
  { name: "Jessica Villarasa" },
  { name: "Karine Payette" },
  { name: "Lucas Azar" },
  { name: "Ludovic Amyot" },
  { name: "Mallory Kerr" },
  { name: "Maria Jose Nolasco Ordonez" },
  { name: "Nicholas Santoianni" },
  { name: "Nicolea Apostolidis" },
  { name: "Oscar Lallier" },
  { name: "Qiqi Liu" },
  { name: "Sarah Delnour" },
  { name: "Sean Wolanyk" },
  { name: "Serena Valles" },
  { name: "Suehayla Eljaji" },
  { name: "Sunny Lan" },
  { name: "Téa Canton" },
  { name: "Victoria Fratipietro" },
];


/* =========================================================
   ROOMS  ·  exhibition layout
   ========================================================= */

const ROOMS = [
  // M2 — first floor
  { id: "101", name: "Room 101", floor: "m2", plan: null, students: [] },
  { id: "102", name: "Room 102", floor: "m2", plan: null, students: [] },
  { id: "114", name: "Room 114", floor: "m2", plan: null, students: [] },

  // U3 — third floor
  { id: "312", name: "Room 312", floor: "u3", plan: null, students: [] },
];


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
  STUDENTS.map(s => [slugify(s.name), s])
);


/* =========================================================
   Section switching + project sub-routing
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
  const student = STUDENT_BY_SLUG[slug];
  if (!student) {
    location.hash = "#projects";
    return;
  }

  setActiveSection("projects");
  projectsListMount.style.display  = "none";
  projectDetailMount.style.display = "";
  projectDetailMount.innerHTML = renderProjectDetail(student);
  document.title = `${student.name} · MAE 2026`;
}

function route() {
  const raw = (location.hash || "#home").slice(1) || "home";

  // Sub-route for individual project: #project/oscar-lallier
  if (raw.startsWith("project/")) {
    const slug = raw.split("/")[1] || "";
    showProjectDetail(slug);
    return;
  }

  // Anything that's not a known section → home
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

/* Single delegated click handler for ALL hash links anywhere on the page —
   header nav AND dynamically rendered links like the project "Back" link.
   This is the bulletproof way; we don't depend on inline handlers being
   re-attached after innerHTML rewrites. */
document.addEventListener("click", e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  if (link.target === "_blank") return;

  const newHash = link.getAttribute("href");
  e.preventDefault();

  // The "MAE" link points to #home; we want a clean URL with no hash there.
  const wantHome = link.dataset.target === "home" || newHash === "#home";
  const targetHash = wantHome ? "" : newHash;

  if (location.hash === targetHash || (wantHome && !location.hash)) {
    route();                       // same hash → re-run router manually
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
   ========================================================= */

function renderRoomCard(room) {
  const planHTML = room.plan
    ? `<img class="room-card__plan" src="${escapeHTML(room.plan)}" alt="Key plan for ${escapeHTML(room.name)}">`
    : `<div class="room-card__plan">Key plan — coming soon</div>`;

  const listHTML = room.students.length
    ? `<ol class="room-card__list">${
        room.students.map(s => `<li><span>${escapeHTML(s)}</span></li>`).join("")
      }</ol>`
    : `<p class="room-card__pending">Names coming soon.</p>`;

  return `
    <article class="room-card" data-room="${escapeHTML(room.id)}">
      <h3 class="room-card__title">${escapeHTML(room.name)}</h3>
      ${planHTML}
      ${listHTML}
    </article>
  `;
}

document.querySelectorAll("[data-rooms-mount]").forEach(mount => {
  const floor = mount.dataset.floor;
  const rooms = ROOMS.filter(r => r.floor === floor);
  mount.innerHTML = rooms.map(renderRoomCard).join("");
});


/* =========================================================
   Render Projects grid (the list view)
   ========================================================= */

const projectsGrid = document.querySelector("[data-projects-grid]");

function renderProjectsGrid() {
  const sorted = [...STUDENTS].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  projectsGrid.innerHTML = sorted.map(s => {
    const slug = slugify(s.name);
    const face = s.face
      ? `<img src="${escapeHTML(s.face)}" alt="Portrait of ${escapeHTML(s.name)}">`
      : `<span class="project-card__face--placeholder">${escapeHTML(initials(s.name))}</span>`;

    return `
      <li>
        <a class="project-card" href="#project/${slug}">
          <div class="project-card__face">${face}</div>
          <span class="project-card__name">${escapeHTML(s.name)}</span>
        </a>
      </li>
    `;
  }).join("");
}

renderProjectsGrid();


/* =========================================================
   Render Project detail (single student page)
   ========================================================= */

function fact(label, value, pending) {
  const cls = pending ? "project-detail__fact-value project-detail__fact-value--pending" : "project-detail__fact-value";
  return `
    <div>
      <span class="project-detail__fact-label">${escapeHTML(label)}</span>
      <span class="${cls}">${escapeHTML(value)}</span>
    </div>
  `;
}

function renderProjectDetail(s) {
  const room = findRoomForStudent(s.name);

  const titleHTML = s.title
    ? `<p class="project-detail__title">${escapeHTML(s.title)}</p>`
    : `<p class="project-detail__title project-detail__pending">Project title — coming soon</p>`;

  const imageHTML = s.image
    ? `<img class="project-detail__image" src="${escapeHTML(s.image)}" alt="${escapeHTML(s.title || s.name)}">`
    : `<div class="project-detail__image">Project image — coming soon</div>`;

  const factsHTML = `
    <div class="project-detail__facts">
      ${fact("Room",    room      || "TBA",     !room)}
      ${fact("Advisor", s.advisor || "Coming soon", !s.advisor)}
    </div>
  `;

  const textHTML = s.text
    ? `<div class="project-detail__text">${
         escapeHTML(s.text).split(/\n\s*\n/).map(p => `<p>${p}</p>`).join("")
       }</div>`
    : `<p class="project-detail__pending">Project description — coming soon (≈400 words).</p>`;

  return `
    <div class="project-detail">
      <a class="project-back" href="#projects">Back to projects</a>

      <div class="project-detail__head">
        <h1 class="project-detail__name">${escapeHTML(s.name)}</h1>
        ${titleHTML}
      </div>

      <div class="project-detail__body">
        ${imageHTML}
        <div class="project-detail__meta">
          ${factsHTML}
          ${textHTML}
        </div>
      </div>
    </div>
  `;
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
