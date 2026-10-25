// Shows notices from moderators (like a changed program code) on the home page.
// The Community page shows the same notices through forum.js.
(function () {
  const box = document.getElementById("notices");
  let state, id;
  try {
    state = JSON.parse(localStorage.getItem("pl-forum"));
    id = localStorage.getItem("pl-user-id");
    if (localStorage.getItem("pl-view") === "mod") return;
  } catch { return; }
  if (!box || !state || !state.notices || !state.accounts || !state.accounts[id]) return;

  const acc = state.accounts[id];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function show() {
    box.innerHTML = state.notices
      .filter(n => n.time > (acc.created || 0) && !(acc.seenNotices || []).includes(n.id))
      .map(n => `
        <div class="notice-banner" role="status">
          <span>🔑 ${esc(n.text)}</span>
          <button class="btn btn-primary" data-notice="${n.id}">Got it</button>
        </div>`).join("");
  }

  box.addEventListener("click", e => {
    const button = e.target.closest("[data-notice]");
    if (!button) return;
    (acc.seenNotices ||= []).push(button.dataset.notice);
    try { localStorage.setItem("pl-forum", JSON.stringify(state)); } catch {}
    show();
  });

  show();
})();
