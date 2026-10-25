// The gear button in the corner and the settings panel it opens.
// The chosen theme is saved in this browser. (A tiny script in each page's <head> applies it before the page shows.)
const themes = [
  { id: "classic", name: "Classic", colors: ["#faf6ec", "#1f3a60"] },
  { id: "rose", name: "Rose", colors: ["#fdf3f4", "#b4466a"] },
  { id: "night", name: "Night", colors: ["#0a1230", "#7ea6ff"] },
  { id: "mulberry", name: "Mulberry", colors: ["#f8f2fa", "#7a3e98"] },
  { id: "nature", name: "Nature", colors: ["#f2f6ee", "#3d7a4e"] },
];

function currentTheme() {
  try { return localStorage.getItem("pl-theme") || "classic"; } catch { return "classic"; }
}

function setTheme(id) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem("pl-theme", id); } catch {}
  document.querySelectorAll("[data-theme-choice]").forEach(b => b.classList.toggle("on", b.dataset.themeChoice === id));
}

const gearIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

function buildSettings() {
  const wrap = document.createElement("div");
  wrap.className = "settings";
  wrap.innerHTML = `
    <div class="settings-panel" id="settings-panel" role="dialog" aria-label="Settings" hidden>
      <div class="settings-head">
        <h3>Settings</h3>
        <button class="settings-close" type="button" aria-label="Close settings">✕</button>
      </div>
      <p class="settings-label">Theme</p>
      <div class="theme-grid">
        ${themes.map(t => `
          <button type="button" class="theme-choice" data-theme-choice="${t.id}">
            <span class="swatch" style="background: linear-gradient(135deg, ${t.colors[0]} 50%, ${t.colors[1]} 50%)"></span>
            ${t.name}
          </button>`).join("")}
      </div>
      <div id="settings-extra"></div>
    </div>
    <button class="settings-btn" type="button" aria-label="Settings" aria-expanded="false" aria-controls="settings-panel">${gearIcon}</button>`;
  document.body.appendChild(wrap);

  const panel = wrap.querySelector(".settings-panel");
  const button = wrap.querySelector(".settings-btn");
  const toggle = open => {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open);
  };

  button.addEventListener("click", () => toggle(panel.hidden));
  wrap.querySelector(".settings-close").addEventListener("click", () => toggle(false));
  wrap.querySelectorAll("[data-theme-choice]").forEach(b => b.addEventListener("click", () => setTheme(b.dataset.themeChoice)));
  document.addEventListener("keydown", e => e.key === "Escape" && toggle(false));
  document.addEventListener("click", e => {
    if (!panel.hidden && !wrap.contains(e.target) && !e.target.closest("dialog")) toggle(false);
  });

  setTheme(currentTheme());
}

buildSettings();
