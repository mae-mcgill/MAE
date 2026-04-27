/* =========================================================
   MAE 2026 — interactions
   - Section switching (home / exhibition / information)
   - Renders room cards on the Exhibition page (key-plan slot
     + numbered student list per room) plus an auto-generated
     "unassigned" block for any M2 student not yet placed.
   - Cursor-following solid black dot (desktop only)
   ========================================================= */


/* ---------------- Master M2 student list ----------------
   Edit freely. Names are the source of truth.
   --------------------------------------------------------- */

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


/* ---------------- Rooms + per-room assignments ----------------
   Add names to a room's "students" array as assignments come in.
   Names listed here are removed from the bottom "unassigned" list
   automatically. The numbered list is rendered in array order, so
   that order is the visitor-facing room order.

   Each room can also point to a "plan" image once it exists, e.g.
     plan: "assets/plans/101.png"
   --------------------------------------------------------------- */

const ROOMS = [
  { id: "101", name: "Room 101", plan: null, students: [] },
  { id: "102", name: "Room 102", plan: null, students: [] },
  { id: "103", name: "Room 103", plan: null, students: [] },
  { id: "114", name: "Room 114", plan: null, students: [] },
];


/* ---------------- Section switching ---------------- */

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");

function showSection(id, push = true) {
  if (!document.getElementById(id)) id = "home";

  sections.forEach(s => s.classList.toggle("active", s.id === id));
  navLinks.forEach(a => a.classList.toggle("is-active", a.dataset.target === id));

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  if (push) history.pushState({ id }, "", id === "home" ? "#" : "#" + id);
}

navLinks.forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    showSection(a.dataset.target);
  });
});

window.addEventListener("popstate", () => {
  const id = (location.hash || "#home").slice(1) || "home";
  showSection(id, false);
});

const initial = (location.hash || "#home").slice(1) || "home";
showSection(initial, false);


/* ---------------- Render Exhibition ---------------- */

const roomsMount      = document.querySelector("[data-rooms-mount]");
const unassignedMount = document.querySelector("[data-unassigned-mount]");

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function renderRooms() {
  roomsMount.innerHTML = ROOMS.map(room => {
    const planHTML = room.plan
      ? `<img class="room-card__plan" src="${escapeHTML(room.plan)}" alt="Key plan for ${escapeHTML(room.name)}">`
      : `<div class="room-card__plan">Key plan — coming soon</div>`;

    const listHTML = room.students.length
      ? `<ol class="room-card__list">${
          room.students.map(s => `<li><span>${escapeHTML(s)}</span></li>`).join("")
        }</ol>`
      : `<p class="room-card__pending">Student assignments coming soon.</p>`;

    return `
      <article class="room-card" data-room="${escapeHTML(room.id)}">
        <h3 class="room-card__title">${escapeHTML(room.name)}</h3>
        ${planHTML}
        ${listHTML}
      </article>
    `;
  }).join("");
}

function renderUnassigned() {
  const assigned = new Set(ROOMS.flatMap(r => r.students));
  const remaining = STUDENTS
    .filter(s => !assigned.has(s))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  if (!remaining.length) {
    unassignedMount.innerHTML = "";
    return;
  }

  unassignedMount.innerHTML = `
    <p class="unassigned__label">Graduating M2 students — room assignments coming soon.</p>
    <ul class="unassigned__list">
      ${remaining.map(s => `<li>${escapeHTML(s)}</li>`).join("")}
    </ul>
  `;
}

renderRooms();
renderUnassigned();


/* ---------------- Cursor-following dot ---------------- */

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
