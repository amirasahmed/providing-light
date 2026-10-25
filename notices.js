// Notices from moderators: program announcements ("No program this week") and code changes.
// These rules are shared by the home page (below) and the Community page (forum.js).

// Which notices this kid should still see.
function visibleNotices(state, acc) {
  return (state.notices || []).filter(n => {
    if (n.time <= (acc.created || 0) || (acc.seenNotices || []).includes(n.id)) return false;
    // An announcement for one program only goes to kids in that program. Everything else goes to everyone.
    if (n.kind === "announcement" && n.groupId) {
      const g = (state.groups || []).find(x => x.id === n.groupId);
      return !!g && g.members.includes(acc.id);
    }
    return true;
  });
}

function noticeLabel(state, n) {
  if (n.kind !== "announcement") return "🔑 " + n.text;
  const g = n.groupId && (state.groups || []).find(x => x.id === n.groupId);
  return `📣 ${g ? g.name : "All programs"}: ${n.text}`;
}

// On the home page, show the banners here. (On the Community page, forum.js does it.)
(function () {
  const box = document.getElementById("notices");
  if (!box || document.getElementById("forum")) return;
  let state, id;
  try {
    state = JSON.parse(localStorage.getItem("pl-forum"));
    id = localStorage.getItem("pl-user-id");
    if (localStorage.getItem("pl-view") === "mod") return;
  } catch { return; }
  if (!state || !state.accounts || !state.accounts[id]) return;

  const acc = state.accounts[id];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function show() {
    box.innerHTML = visibleNotices(state, acc).map(n => `
      <div class="notice-banner" role="status">
        <span>${esc(noticeLabel(state, n))}</span>
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
