// ---------- Settings ----------
const NEW_USER_POSTS = 2;                     // a new member's first posts need a moderator's approval
const MAX_DEPTH = 3;                          // replies can nest this many levels deep
const SLIP_LIMIT = 3;                         // bad-word slips allowed in one day before a timeout
const SLIP_WINDOW = 24 * 60 * 60 * 1000;      // one day
const TIMEOUT_LENGTH = 10 * 60 * 1000;        // 10 minutes
const NAME_CHANGE_WAIT = 30 * 24 * 60 * 60 * 1000; // 30 days between name changes

const MOD_ID = "user_00001";

const boards = [
  { id: "announcements", name: "Announcements", icon: "📣", desc: "News from the program team. Only moderators can post here.", modOnly: true },
  { id: "deen", name: "Deen Questions", icon: "🌙", desc: "Ask about faith. Look for ✅ verified answers from trusted teachers." },
  { id: "school", name: "School & Life", icon: "🎒", desc: "Homework stress, friendships, family, and everything in between." },
  { id: "events", name: "Event Talk", icon: "📅", desc: "Talk about our events, before and after." },
  { id: "books", name: "Book & Quran Club", icon: "📖", desc: "What we're reading, reciting, and learning." },
  { id: "fun", name: "Fun & Games", icon: "🎲", desc: "Jokes, riddles, games, and good vibes." },
];

const tags = ["Question", "Advice", "Fun", "Event"];
const roleBadges = { mod: "⭐ Moderator", teacher: "🎓 Teacher" };

// ---------- Safe name lists ----------
const nameStarts = ["Brave", "Quiet", "Bright", "Golden", "Gentle", "Calm", "Kind", "Swift", "Shining", "Peaceful", "Clever", "Hopeful", "Sunny", "Bold", "Happy", "Steady"];
const nameEnds = ["Falcon", "River", "Crescent", "Lantern", "Cedar", "Meadow", "Star", "Owl", "Willow", "Harbor", "Comet", "Olive", "Garden", "Dove", "Maple", "Horizon"];

function randomName(accounts = state.accounts) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const taken = new Set(Object.values(accounts).map(a => a.name));
  let name;
  do name = `${pick(nameStarts)} ${pick(nameEnds)}`; while (taken.has(name));
  return name;
}

// ---------- Accounts ----------
// Every account has a permanent hidden ID. The display name is just one setting on it.
// Posts, warnings, and timeouts are all saved under the ID, so changing your name changes nothing else.
function makeAccount(id, name, role = "kid", history = [], avatar = null) {
  avatar = avatar || avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
  return { id, name, role, history, avatar, lastNameChange: null, approved: role === "kid" ? NEW_USER_POSTS : 0, slips: [], timeoutUntil: 0 };
}

const accountOf = id => state.accounts[id] || { id, name: "Former member", role: "kid", history: [], avatar: "lantern" };
const nameOf = id => accountOf(id).name;

let viewMode = localStorage.getItem("pl-view") || "kid";
const isMod = () => viewMode === "mod";
const myAccount = () => state.accounts[localStorage.getItem("pl-user-id")];
const me = () => (isMod() ? state.accounts[MOD_ID] : myAccount());

// In the real version a parent creates the account. In the demo, one is made on your first visit.
function ensureMyAccount(s) {
  let id = localStorage.getItem("pl-user-id");
  if (id && s.accounts[id]) return;
  do id = "user_" + Math.floor(10000 + Math.random() * 90000); while (s.accounts[id]);
  localStorage.setItem("pl-user-id", id);
  s.accounts[id] = makeAccount(id, randomName(s.accounts), "kid");
  s.accounts[id].approved = 0; // brand-new member: first posts need approval
}

// ---------- Saved posts ----------
let nextId = Date.now();
const newId = () => (nextId++).toString(36);
const hoursAgo = h => Date.now() - h * 3600000;
const fakeHearts = n => Array.from({ length: n }, (_, i) => "member" + i);

function makeThread(o) {
  return {
    id: o.id || newId(), board: o.board, title: o.title, body: o.body, tag: o.tag || "Question",
    authorId: o.authorId, time: o.time || Date.now(), hearts: o.hearts || [],
    pinned: !!o.pinned, weekly: !!o.weekly, eventId: o.eventId || null,
    locked: null, hidden: null, removed: null, status: o.status || "live", replies: o.replies || [],
  };
}

function makeReply(o) {
  return {
    id: o.id || newId(), parent: o.parent || null, body: o.body, authorId: o.authorId,
    time: o.time || Date.now(), hearts: o.hearts || [], verified: !!o.verified, hidden: null, status: o.status || "live",
  };
}

// Example accounts and posts so the demo doesn't start empty.
function seedState() {
  const accounts = {};
  const add = (id, name, role, history, avatar) => (accounts[id] = makeAccount(id, name, role, history, avatar), id);
  const leader = add(MOD_ID, "Program Leader", "mod", [], "lantern");
  const teacher = add("user_00002", "Ustadha Maryam", "teacher", [], "quran");
  const [river, crescent, willow, meadow, cedar, lantern, harbor, olive, comet, owl, star, dove] = [
    ["user_31852", "Calm River"], ["user_47019", "Bright Crescent"], ["user_25563", "Gentle Willow"],
    ["user_60284", "Happy Meadow"], ["user_19937", "Bold Cedar"], ["user_48213", "Golden Lantern", [{ name: "Brave Falcon", changed: hoursAgo(24 * 12) }]],
    ["user_72640", "Sunny Harbor"], ["user_55108", "Kind Olive"], ["user_83391", "Quiet Comet"],
    ["user_26774", "Clever Owl"], ["user_91425", "Shining Star"], ["user_38056", "Hopeful Dove"],
  ].map(([id, name, history]) => add(id, name, "kid", history));

  const s = { version: 2, accounts, log: [], threads: [
    makeThread({ board: "announcements", title: "Welcome to Providing Light! Please read 💛", tag: "Announcement", authorId: leader, pinned: true, time: hoursAgo(96),
      body: "Assalamu alaikum and welcome!\n\nThis is a space to ask questions, share, and support each other. A few things to remember:\n• Stay anonymous. Never share your real name, school, or contact info.\n• Be kind. Bad words get hidden, and bullying is never okay.\n• Your first 2 posts are checked by a moderator.\n• Tap 🚩 if anything feels wrong.\n\nWe're so glad you're here." }),
    makeThread({ board: "fun", title: "Weekly prompt: What's one good deed you did this week?", tag: "Fun", authorId: leader, pinned: true, weekly: true, time: hoursAgo(30),
      body: "Share something kind you did, big or small. It might inspire someone else! 🌱",
      replies: [
        makeReply({ body: "I helped my little brother with his reading homework!", authorId: river, time: hoursAgo(20), hearts: fakeHearts(4) }),
        makeReply({ body: "I made dua for my friend who was sick 🤲", authorId: crescent, time: hoursAgo(8), hearts: fakeHearts(3) }),
      ] }),
    makeThread({ board: "deen", title: "Read first: how verified answers work", tag: "Announcement", authorId: leader, pinned: true, time: hoursAgo(90),
      body: "When a trusted teacher or imam answers a question, their reply gets a ✅ Verified answer badge and moves to the top. Other replies are welcome too, but look for the badge when you want an answer you can trust." }),
    makeThread({ board: "deen", title: "Is it okay to pray in English if I don't know the Arabic yet?", authorId: willow, time: hoursAgo(26), hearts: fakeHearts(5),
      body: "I'm still learning the Arabic and I get nervous that I'm doing it wrong. Can I just say it in English for now?",
      replies: [
        makeReply({ body: "I'm wondering this too!", authorId: meadow, time: hoursAgo(24), hearts: fakeHearts(1) }),
        makeReply({ body: "Such a good question, and it's normal to feel nervous! The recited parts of salah, like Al-Fatiha, are said in Arabic, and it's okay to learn them slowly, one step at a time. Your own duas can be in any language. Allah understands every language. 💛", authorId: teacher, time: hoursAgo(20), hearts: fakeHearts(9), verified: true }),
      ] }),
    makeThread({ board: "deen", title: "How do I keep up with Fajr on school days?", authorId: cedar, time: hoursAgo(5),
      body: "I keep sleeping through my alarm. Any tips?" }),
    makeThread({ board: "school", title: "Tips for not stressing about exams?", tag: "Advice", authorId: lantern, time: hoursAgo(14), hearts: fakeHearts(3),
      body: "I have three tests next week and I'm freaking out a little 😅",
      replies: [
        makeReply({ id: "seed-study", body: "Study in short chunks: 25 minutes, then a 5 minute break. It really helps me!", authorId: harbor, time: hoursAgo(12), hearts: fakeHearts(6) }),
        makeReply({ parent: "seed-study", body: "Thanks, I'll try that!", authorId: lantern, time: hoursAgo(11) }),
      ] }),
    makeThread({ board: "books", title: "What surah are you memorizing right now?", authorId: olive, time: hoursAgo(40), hearts: fakeHearts(2),
      body: "I just finished Surah Al-Kahf's first 10 ayat!",
      replies: [makeReply({ body: "Al-Mulk! It's long but I'm halfway 😄", authorId: comet, time: hoursAgo(33), hearts: fakeHearts(2) })] }),
    makeThread({ board: "fun", title: "Riddle: What has keys but can't open locks?", tag: "Fun", authorId: owl, time: hoursAgo(9), hearts: fakeHearts(4),
      body: "Bet you can't get it 😏",
      replies: [makeReply({ body: "A piano! 🎹", authorId: star, time: hoursAgo(7), hearts: fakeHearts(2) })] }),
  ] };

  ensureEventThreads(s);
  const gameNight = s.threads.find(t => t.id === "event-game-night");
  if (gameNight) gameNight.replies.push(makeReply({ body: "Can we play Uno? 🃏", authorId: dove, time: hoursAgo(3), hearts: fakeHearts(3) }));
  return s;
}

// Every event in events.js gets its own discussion thread.
function ensureEventThreads(s) {
  for (const e of events) {
    const id = "event-" + e.id;
    if (s.threads.some(t => t.id === id)) continue;
    s.threads.push(makeThread({ id, board: "events", eventId: e.id, tag: "Event", authorId: MOD_ID, time: hoursAgo(48),
      title: `${e.title} (${formatEventDate(e)})`,
      body: `Talk about ${e.title} here, before and after! Questions, ideas, who's coming… 📅` }));
  }
}

let state;

function loadState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem("pl-forum"));
  } catch {}
  if (!s || s.version !== 2) s = seedState();
  ensureEventThreads(s);
  ensureMyAccount(s);
  for (const acc of Object.values(s.accounts)) acc.avatar ||= avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
  return s;
}

state = loadState();
const save = () => localStorage.setItem("pl-forum", JSON.stringify(state));
save();

// Things that only matter while the page is open.
let sortMode = "new";
let replyingTo = null;
let showNewForm = false;

// ---------- Safety checks ----------
// Step 1: mild bad words get replaced with *** before anyone sees them.
const mildWords = /\b(fuck\w*|shit\w*|bitch\w*|ass|asshole\w*|crap\w*|damn\w*|bastard\w*|dick\w*|piss\w*|stupid|idiot\w*|dumb|loser\w*)\b/gi;

// Step 4: serious posts are blocked and reported to a leader right away, even the first time.
const seriousChecks = [
  { type: "danger", test: t => /\b(kill myself|want to die|wanna die|hurt myself|cut myself|suicide|suicidal|end it all|don'?t want to (live|be here))\b/i.test(t) },
  { type: "bullying", test: t => /\b(kill yourself|kys|go die|nobody likes you|everyone hates you|i hate you|you'?re ugly|you are ugly|beat you up|(i'?ll|i will|gonna) (hurt|hit|find|get) you)\b/i.test(t) },
  // Add more hateful words or phrases to this list.
  { type: "hate", test: t => /\b(go back to your country)\b/i.test(t) },
  { type: "personal info", test: t =>
      /\S+@\S+\.\S+/.test(t) ||                                   // email
      /(\d[\s\-.()]*){7,}/.test(t) ||                             // phone number
      /@\w{3,}/.test(t) ||                                        // @username
      /\b(instagram|insta|snapchat|snap|tiktok|discord)\b/i.test(t) ||
      /\b(i live (at|on)|my address|my school is)\b/i.test(t) },
];

function findSerious(text) {
  const match = seriousChecks.find(c => c.test(text));
  return match ? match.type : null;
}

const popups = {
  mild: { icon: "🙂", title: "Hey, let's keep it clean", text: "Your post went up, but some words were hidden. Remember our community guidelines!" },
  timeout: { icon: "⏸️", title: "Let's take a short break", text: "That's a few slips in a short time, so posting is paused for 10 minutes. Take a breather and come back soon. 💛" },
  bullying: { icon: "🛑", title: "That post wasn't shared", text: "It could hurt someone, so it was sent to a program leader instead. Everyone here deserves to feel safe." },
  hate: { icon: "🛑", title: "That post wasn't shared", text: "Hateful words aren't allowed here, so it was sent to a program leader." },
  "personal info": { icon: "🙈", title: "Let's keep you anonymous", text: "That looked like personal info (like a phone number, email, social media, or where you live), so it wasn't shared. A leader was let know, just to help keep you safe." },
  danger: { icon: "💛", title: "You're not alone", text: "It sounds like you might be going through something really hard. A program leader has been let know and will check in with you. If you need help right now, call or text 988, any time." },
  pending: { icon: "⏳", title: "Almost there!", text: `Thanks for posting! A new member's first ${NEW_USER_POSTS} posts are checked by a moderator before they go live. After that, you can post freely.` },
  reported: { icon: "🚩", title: "Thanks for telling us", text: "A moderator will take a look. You helped keep the community safe." },
};

function showPopup(p) {
  document.getElementById("popup-icon").textContent = p.icon;
  document.getElementById("popup-title").textContent = p.title;
  document.getElementById("popup-text").textContent = p.text;
  document.getElementById("popup").showModal();
}

// Asks a moderator for a short reason. Gives back the note, or null if they cancel.
function askNote(title) {
  const dialog = document.getElementById("note-dialog");
  const input = document.getElementById("note-input");
  document.getElementById("note-title").textContent = title;
  input.value = "";
  dialog.showModal();
  return new Promise(resolve => {
    const finish = value => { dialog.close(); resolve(value); };
    document.getElementById("note-ok").onclick = e => { e.preventDefault(); finish(input.value.trim()); };
    document.getElementById("note-cancel").onclick = e => { e.preventDefault(); finish(null); };
    dialog.oncancel = () => resolve(null); // pressing Escape
  });
}

function reportToLeader(type, text, fromId = me().id, where = "") {
  state.log.unshift({ type, text, fromId, where, time: Date.now() });
}

// Step 3: repeated slips. 3 in a day = a 10-minute timeout and a quiet note to the leader.
// Slips and timeouts belong to the account ID, so a new name doesn't reset them.
function addSlip() {
  const acc = me();
  const now = Date.now();
  acc.slips = acc.slips.filter(t => now - t < SLIP_WINDOW);
  acc.slips.push(now);
  if (acc.slips.length < SLIP_LIMIT) return false;

  acc.slips = [];
  acc.timeoutUntil = now + TIMEOUT_LENGTH;
  reportToLeader("timeout", `${SLIP_LIMIT} slips in one day. Paused from posting for 10 minutes.`);
  return true;
}

const timeLeft = () => (isMod() ? 0 : me().timeoutUntil - Date.now());

// Runs every post through the safety steps. Gives back the cleaned text, or null if it was blocked.
function checkPost(texts, where) {
  if (isMod()) return { texts, slipped: false };

  const serious = findSerious(texts.join(" "));
  if (serious) {
    reportToLeader(serious, texts.join(" — "), me().id, where);
    const timedOut = (serious === "bullying" || serious === "hate") && addSlip();
    showPopup(timedOut ? popups.timeout : popups[serious]);
    return null;
  }

  const cleaned = texts.map(t => t.replace(mildWords, w => "*".repeat(w.length)));
  return { texts: cleaned, slipped: cleaned.some((t, i) => t !== texts[i]) };
}

function afterPost(slipped, status) {
  if (slipped) showPopup(addSlip() ? popups.timeout : popups.mild);
  else if (status === "pending") showPopup(popups.pending);
  save();
  updateTimeout();
}

// New members' first posts wait for a moderator.
const needsApproval = () => !isMod() && me().approved < NEW_USER_POSTS;

// Turns posting off during a timeout and shows a countdown.
function updateTimeout() {
  const banner = document.getElementById("timeout-banner");
  const left = timeLeft();
  document.querySelectorAll("[data-post-btn]").forEach(b => (b.disabled = left > 0));
  if (left > 0) {
    const min = Math.floor(left / 60000);
    const sec = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    banner.textContent = `⏸️ Taking a short break. You can post again in ${min}:${sec}`;
  } else {
    banner.textContent = "";
  }
}

// ---------- Changing your name ----------
function nextNameChange(acc) {
  return acc.lastNameChange ? acc.lastNameChange + NAME_CHANGE_WAIT : 0;
}

let nameCandidate = "";

function openNameDialog() {
  const acc = myAccount();
  if (nextNameChange(acc) > Date.now()) {
    const when = new Date(nextNameChange(acc)).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    showPopup({ icon: "🗓️", title: "Not just yet", text: `You can change your name once every 30 days. You can pick a new one on ${when}.` });
    return;
  }
  nameCandidate = randomName();
  document.getElementById("name-preview").textContent = nameCandidate;
  document.getElementById("name-dialog").showModal();
}

document.getElementById("shuffle-name").addEventListener("click", () => {
  nameCandidate = randomName();
  document.getElementById("name-preview").textContent = nameCandidate;
});

document.getElementById("name-ok").addEventListener("click", e => {
  e.preventDefault();
  document.getElementById("name-dialog").close();
  const acc = myAccount();
  acc.history.push({ name: acc.name, changed: Date.now() });
  acc.name = nameCandidate;
  acc.lastNameChange = Date.now();
  save();
  render();
});

// ---------- Helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function timeAgo(t) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

const findBoard = id => boards.find(b => b.id === id);
const liveReplies = t => t.replies.filter(r => r.status === "live" && r.hidden === null);
const isMine = post => post.authorId === me().id;

function canSeeThread(t) {
  if (t.removed !== null) return true; // shows as a short "removed" note
  if (t.status === "pending") return isMod() || isMine(t);
  if (t.hidden !== null) return isMod();
  return true;
}

const canSeeReply = r => r.status === "live" || isMod() || isMine(r);

// The hidden ID and past names, which only moderators can see.
function modInfo(acc) {
  if (!isMod() || acc.role !== "kid") return "";
  const past = acc.history.length ? ` · was ${acc.history.map(h => esc(h.name)).join(", ")}` : "";
  return ` <span class="mod-id" title="Only moderators see this">${esc(acc.id)}${past}</span>`;
}

function avatar(acc, size = "") {
  return `<span class="avatar ${size}" title="${esc((avatars[acc.avatar] || avatars.lantern).label)}">${avatarSvg(acc.avatar)}</span>`;
}

function author(id) {
  const acc = accountOf(id);
  const badge = roleBadges[acc.role] ? ` <span class="role-badge role-${acc.role}">${roleBadges[acc.role]}</span>` : "";
  return `${avatar(acc)}<strong>${esc(acc.name)}</strong>${badge}${modInfo(acc)}`;
}

// The "Profile icon" part of the settings panel (from settings.js).
function avatarPickerView() {
  const acc = me();
  return `
    <p class="settings-label">Profile icon${isMod() ? " (moderator)" : ""}</p>
    <div class="avatar-grid">
      ${avatarKeys.map(k => `
        <button type="button" class="avatar-choice ${acc.avatar === k ? "on" : ""}" data-action="avatar" data-avatar="${k}" title="${avatars[k].label}" aria-label="${avatars[k].label}" aria-pressed="${acc.avatar === k}">
          ${avatarSvg(k)}
        </button>`).join("")}
    </div>`;
}

function tagChip(tag) {
  return `<span class="tag tag-${tag.toLowerCase()}">${esc(tag)}</span>`;
}

function heartButton(target, threadId, replyId = "") {
  const mine = target.hearts.includes(me().id);
  return `<button class="chip-btn ${mine ? "on" : ""}" data-action="heart" data-thread="${threadId}" data-reply="${replyId}" aria-pressed="${mine}">❤️ ${target.hearts.length} Helpful</button>`;
}

function reportButton(target, threadId, replyId = "") {
  if (isMod() || isMine(target) || accountOf(target.authorId).role !== "kid") return "";
  if (target.reported) return `<span class="chip-note">🚩 Reported</span>`;
  return `<button class="chip-btn" data-action="report" data-thread="${threadId}" data-reply="${replyId}" title="Report this">🚩 Report</button>`;
}

// ---------- Pages ----------
function toolbarView() {
  const pending = state.threads.filter(t => t.status === "pending").length +
    state.threads.reduce((n, t) => n + t.replies.filter(r => r.status === "pending").length, 0);
  return `
    <div class="whoami">
      ${isMod()
        ? `Posting as ${author(MOD_ID)}`
        : `Posting as ${avatar(me())}<strong>${esc(me().name)}</strong> <button class="link-btn" data-action="change-name">Change name</button>`}
    </div>
    <div class="toolbar-right">
      ${isMod() ? `<a class="mod-link" href="#/mod">🛡️ Moderator panel${pending ? ` <span class="count">${pending}</span>` : ""}</a>` : ""}
      <div class="view-toggle" role="group" aria-label="Demo view">
        <span class="view-label">🧪 Demo view:</span>
        <button data-action="view" data-view="kid" class="${isMod() ? "" : "on"}">Kid</button>
        <button data-action="view" data-view="mod" class="${isMod() ? "on" : ""}">Moderator</button>
      </div>
    </div>`;
}

function homeView() {
  const weekly = state.threads.find(t => t.weekly && t.removed === null && t.hidden === null);
  const boardCards = boards.map(b => {
    const count = state.threads.filter(t => t.board === b.id && canSeeThread(t) && t.removed === null).length;
    return `
      <a class="board-card" href="#/board/${b.id}">
        <span class="board-icon">${b.icon}</span>
        <div>
          <h3>${b.name}${b.modOnly ? ` <span class="mod-only">Moderators only</span>` : ""}</h3>
          <p>${b.desc}</p>
          <span class="board-count">${count} thread${count === 1 ? "" : "s"}</span>
        </div>
      </a>`;
  }).join("");

  return `
    <h1 class="page-title">Community</h1>
    <p class="section-intro">Pick a board, start a thread, and help each other out.</p>
    ${weekly ? `
      <a class="weekly-card" href="#/thread/${weekly.id}">
        <span class="weekly-label">✨ This week's prompt</span>
        <strong>${esc(weekly.title.replace(/^Weekly prompt:\s*/, ""))}</strong>
        <span class="weekly-cta">Share yours →</span>
      </a>` : ""}
    <div class="board-grid">${boardCards}</div>`;
}

function boardView(id) {
  const b = findBoard(id);
  if (!b) return homeView();

  let list = state.threads.filter(t => t.board === id && canSeeThread(t));
  const popularity = t => t.hearts.length + liveReplies(t).length * 2;
  if (sortMode === "unanswered") list = list.filter(t => t.removed === null && !t.pinned && liveReplies(t).length === 0);
  list.sort((a, c) => sortMode === "popular" ? popularity(c) - popularity(a) : c.time - a.time);
  if (sortMode !== "unanswered") list.sort((a, c) => c.pinned - a.pinned);

  const canPost = !b.modOnly || isMod();
  const sorts = [["new", "🕒 New"], ["popular", "🔥 Popular"], ["unanswered", "🙋 Unanswered"]];

  const items = list.map(t => {
    if (t.removed !== null) return `<li class="thread-item removed">🗑️ A thread was removed by a moderator${t.removed ? `: <em>${esc(t.removed)}</em>` : "."}</li>`;
    const count = liveReplies(t).length;
    const hasVerified = t.replies.some(r => r.verified && r.status === "live" && r.hidden === null);
    return `
      <li class="thread-item ${t.status === "pending" ? "pending" : ""} ${t.hidden !== null ? "is-hidden" : ""}">
        <a href="#/thread/${t.id}">
          <div class="chips">
            ${t.pinned ? `<span class="chip-note">📌 Pinned</span>` : ""}
            ${tagChip(t.tag)}
            ${hasVerified ? `<span class="chip-note verified-chip">✅ Verified answer</span>` : ""}
            ${t.locked !== null ? `<span class="chip-note">🔒 Locked</span>` : ""}
            ${t.status === "pending" ? `<span class="chip-note">⏳ Waiting for approval</span>` : ""}
            ${t.hidden !== null ? `<span class="chip-note">👁️ Hidden from kids</span>` : ""}
          </div>
          <h3>${esc(t.title)}</h3>
          <div class="meta">${esc(nameOf(t.authorId))} · ${timeAgo(t.time)} · 💬 ${count} · ❤️ ${t.hearts.length}</div>
        </a>
      </li>`;
  }).join("");

  return `
    <a class="back" href="#/">← All boards</a>
    <h1 class="page-title">${b.icon} ${b.name}</h1>
    <p class="section-intro">${b.desc}</p>

    <div class="board-controls">
      <div class="sort-tabs" role="group" aria-label="Sort threads">
        ${sorts.map(([key, label]) => `<button data-action="sort" data-sort="${key}" class="${sortMode === key ? "on" : ""}">${label}</button>`).join("")}
      </div>
      ${canPost ? `<button class="btn btn-primary" data-action="new-thread">${showNewForm ? "Cancel" : "+ New thread"}</button>`
                : `<span class="chip-note">🔒 Only moderators can post here</span>`}
    </div>

    ${canPost && showNewForm ? `
      <form class="card composer" data-form="thread" data-board="${b.id}">
        <label>Title <input name="title" maxlength="100" required placeholder="What's your thread about?"></label>
        <label>Tag
          <select name="tag">${(isMod() ? [...tags, "Announcement"] : tags).map(t => `<option>${t}</option>`).join("")}</select>
        </label>
        <label>Post <textarea name="body" rows="4" maxlength="1000" required placeholder="Share your question or thoughts…"></textarea></label>
        <button class="btn btn-primary" data-post-btn>Post thread</button>
      </form>` : ""}

    <ul class="thread-list">
      ${items || `<li class="empty">${sortMode === "unanswered" ? "Every question here has an answer! 🎉" : "No threads yet. Be the first!"}</li>`}
    </ul>`;
}

function threadView(id) {
  const t = state.threads.find(x => x.id === id);
  if (!t || !canSeeThread(t) || t.removed !== null) {
    return `
      <a class="back" href="#/">← All boards</a>
      <div class="card empty">${t && t.removed !== null ? `🗑️ This thread was removed by a moderator${t.removed ? `: <em>${esc(t.removed)}</em>` : "."}` : "This thread isn't available."}</div>`;
  }

  const b = findBoard(t.board);
  const ev = t.eventId && events.find(e => e.id === t.eventId);
  const isLive = t.status === "live";

  const modTools = isMod() ? `
    <div class="mod-tools">
      <span class="mod-tools-label">🛡️</span>
      ${t.status === "pending" ? `<button data-action="approve" data-thread="${t.id}">✅ Approve</button><button data-action="reject" data-thread="${t.id}">✖ Reject</button>` : ""}
      <button data-action="pin" data-thread="${t.id}">${t.pinned ? "Unpin" : "📌 Pin"}</button>
      <button data-action="lock" data-thread="${t.id}">${t.locked !== null ? "Unlock" : "🔒 Lock"}</button>
      <button data-action="hide" data-thread="${t.id}">${t.hidden !== null ? "Unhide" : "👁️ Hide"}</button>
      <button data-action="remove" data-thread="${t.id}">🗑️ Remove</button>
    </div>` : "";

  let replyArea;
  if (!isLive) replyArea = `<p class="chip-note">Replies open once this post is approved.</p>`;
  else if (t.locked !== null) replyArea = "";
  else replyArea = `
    <form class="card composer" data-form="reply" data-thread="${t.id}">
      <label>Add a reply <textarea name="body" rows="3" maxlength="1000" required placeholder="Write something helpful and kind…"></textarea></label>
      <button class="btn btn-primary" data-post-btn>Reply</button>
    </form>`;

  return `
    <a class="back" href="#/board/${b.id}">← ${b.icon} ${b.name}</a>

    ${ev ? `
      <div class="event-box">
        <span>📅 <strong>${esc(ev.title)}</strong> · ${formatEventDate(ev)} · ${esc(ev.time)} · 📍 ${esc(ev.place)}</span>
        <span>${isPast(ev) ? "This event already happened. Share how it went!" : `<a href="index.html#events">See all events</a>`}</span>
      </div>` : ""}

    <article class="card post">
      ${t.status === "pending" ? `<p class="status-note">⏳ Waiting for a moderator to approve this post.</p>` : ""}
      ${t.hidden !== null ? `<p class="status-note">👁️ Hidden from kids${t.hidden ? `: ${esc(t.hidden)}` : ""}</p>` : ""}
      ${t.locked !== null ? `<p class="status-note">🔒 Locked by a moderator, so no new replies.${t.locked ? ` Note: ${esc(t.locked)}` : ""}</p>` : ""}
      <div class="chips">${t.pinned ? `<span class="chip-note">📌 Pinned</span>` : ""}${tagChip(t.tag)}</div>
      <h1 class="post-title">${esc(t.title)}</h1>
      <div class="meta">${author(t.authorId)} · ${timeAgo(t.time)}</div>
      <p class="post-body">${esc(t.body)}</p>
      <div class="actions">${heartButton(t, t.id)}${reportButton(t, t.id)}</div>
      ${modTools}
    </article>

    <h2 class="replies-title">Replies (${liveReplies(t).length})</h2>
    ${replyArea}
    <div class="replies">${repliesView(t, null, 1) || `<p class="empty">No replies yet. Be the first to help!</p>`}</div>`;
}

// Shows replies under a parent, nesting up to MAX_DEPTH levels.
function repliesView(t, parentId, depth) {
  const list = t.replies
    .filter(r => r.parent === parentId && canSeeReply(r))
    .sort((a, b) => (b.verified - a.verified) || (a.time - b.time));

  return list.map(r => {
    const hiddenForMe = r.hidden !== null && !isMod();
    const canReply = depth < MAX_DEPTH && t.locked === null && t.status === "live" && r.status === "live" && !hiddenForMe;
    const modTools = isMod() ? `
      <div class="mod-tools small">
        ${r.status === "pending" ? `<button data-action="approve" data-thread="${t.id}" data-reply="${r.id}">✅ Approve</button><button data-action="reject" data-thread="${t.id}" data-reply="${r.id}">✖ Reject</button>` : ""}
        <button data-action="hide" data-thread="${t.id}" data-reply="${r.id}">${r.hidden !== null ? "Unhide" : "👁️ Hide"}</button>
        ${t.board === "deen" ? `<button data-action="verify" data-thread="${t.id}" data-reply="${r.id}">${r.verified ? "Remove verified" : "✅ Mark verified"}</button>` : ""}
      </div>` : "";

    return `
      <div class="reply ${r.verified ? "verified" : ""} ${r.status === "pending" ? "pending" : ""}">
        ${r.verified ? `<div class="verified-badge">✅ Verified answer</div>` : ""}
        <div class="meta">${author(r.authorId)} · ${timeAgo(r.time)}</div>
        ${hiddenForMe
          ? `<p class="stub">Hidden by a moderator${r.hidden ? `: ${esc(r.hidden)}` : "."}</p>`
          : `<p class="post-body">${esc(r.body)}</p>`}
        ${r.status === "pending" ? `<p class="status-note">⏳ Waiting for a moderator to approve this reply.</p>` : ""}
        ${r.hidden !== null && isMod() ? `<p class="status-note">👁️ Hidden from kids${r.hidden ? `: ${esc(r.hidden)}` : ""}</p>` : ""}
        ${hiddenForMe ? "" : `
          <div class="actions">
            ${heartButton(r, t.id, r.id)}
            ${canReply ? `<button class="chip-btn" data-action="reply-to" data-thread="${t.id}" data-reply="${r.id}">↩ Reply</button>` : ""}
            ${reportButton(r, t.id, r.id)}
          </div>`}
        ${modTools}
        ${replyingTo === r.id ? `
          <form class="composer inline" data-form="reply" data-thread="${t.id}" data-parent="${r.id}">
            <label class="visually-hidden" for="reply-${r.id}">Reply to ${esc(nameOf(r.authorId))}</label>
            <textarea id="reply-${r.id}" name="body" rows="2" maxlength="1000" required placeholder="Reply to ${esc(nameOf(r.authorId))}…"></textarea>
            <button class="btn btn-primary" data-post-btn>Reply</button>
          </form>` : ""}
        <div class="children">${repliesView(t, r.id, depth + 1)}</div>
      </div>`;
  }).join("");
}

const logLabels = {
  danger: "🚨 Urgent: may be in danger",
  bullying: "🛑 Bullying or threat",
  hate: "🛑 Hate speech",
  "personal info": "🙈 Tried to share personal info",
  timeout: "⏸️ Quiet note: timeout",
  reported: "🚩 Reported by a member",
};

function modView() {
  if (!isMod()) return `<a class="back" href="#/">← All boards</a><div class="card empty">Switch to the Moderator view to see this page.</div>`;

  const pending = [];
  for (const t of state.threads) {
    if (t.status === "pending") pending.push({ t, text: t.title, kind: "Thread", authorId: t.authorId });
    for (const r of t.replies) if (r.status === "pending") pending.push({ t, r, text: r.body, kind: "Reply", authorId: r.authorId });
  }

  const pendingItems = pending.map(p => `
    <li class="card">
      <div class="meta"><strong>${p.kind}</strong> by ${author(p.authorId)} in ${findBoard(p.t.board).name}</div>
      <p class="post-body">${esc(p.text)}</p>
      <div class="mod-tools">
        <button data-action="approve" data-thread="${p.t.id}" data-reply="${p.r ? p.r.id : ""}">✅ Approve</button>
        <button data-action="reject" data-thread="${p.t.id}" data-reply="${p.r ? p.r.id : ""}">✖ Reject</button>
        <a href="#/thread/${p.t.id}">View thread</a>
      </div>
    </li>`).join("");

  const logItems = state.log.map(l => `
    <li class="${l.type === "danger" ? "urgent" : ""}">
      <strong>${logLabels[l.type]}</strong>
      <span>${author(l.fromId)}${l.where ? ` · ${esc(l.where)}` : ""} · ${timeAgo(l.time)}</span>
      <p>${esc(l.text)}</p>
    </li>`).join("");

  // Everything here is looked up by hidden ID, so it follows a member through name changes.
  const myId = myAccount().id;
  const members = Object.values(state.accounts)
    .filter(a => a.role === "kid")
    .sort((a, b) => (b.id === myId) - (a.id === myId) || a.name.localeCompare(b.name))
    .map(a => {
      const reports = state.log.filter(l => l.fromId === a.id && l.type !== "reported").length;
      const left = a.timeoutUntil - Date.now();
      const status = left > 0 ? `⏸️ Paused, ${Math.ceil(left / 60000)} min left` : "Active";
      return `
        <li class="card member">
          <div><strong>${esc(a.name)}</strong> <span class="mod-id">${esc(a.id)}</span>${a.id === myId ? ` <span class="chip-note">(you, in Kid view)</span>` : ""}</div>
          <div class="meta">
            Past names: ${a.history.length ? a.history.map(h => esc(h.name)).join(", ") : "none"} ·
            Approved posts: ${Math.min(a.approved, NEW_USER_POSTS) < NEW_USER_POSTS ? `${a.approved} of ${NEW_USER_POSTS} (new member)` : "trusted"} ·
            Slips today: ${a.slips.filter(t => Date.now() - t < SLIP_WINDOW).length} ·
            Safety reports: ${reports} · ${status}
          </div>
        </li>`;
    }).join("");

  return `
    <a class="back" href="#/">← All boards</a>
    <h1 class="page-title">🛡️ Moderator panel</h1>
    <p class="section-intro">New members' posts wait here for approval. Serious safety reports show up right away.</p>

    <h2 class="replies-title">Waiting for approval (${pending.length})</h2>
    <ul class="pending-list">${pendingItems || `<li class="empty">All caught up! Switch to Kid view and make a post to see it land here.</li>`}</ul>

    <h2 class="replies-title">Safety reports (${state.log.length})</h2>
    <ul class="leader-log">${logItems || `<li class="empty">Nothing yet. Try posting a bad word or a phone number in Kid view.</li>`}</ul>

    <h2 class="replies-title">Members</h2>
    <p class="section-intro">Each member has a hidden ID that never changes. Names, warnings, and timeouts all stay attached to it.</p>
    <ul class="pending-list">${members}</ul>

    <button class="btn btn-ghost" data-action="reset">Reset demo</button>`;
}

function render() {
  const [, view, id] = (location.hash.slice(1) || "/").split("/");
  document.getElementById("forum-toolbar").innerHTML = toolbarView();
  const forum = document.getElementById("forum");
  if (view === "board") forum.innerHTML = boardView(id);
  else if (view === "thread") forum.innerHTML = threadView(id);
  else if (view === "mod") forum.innerHTML = modView();
  else forum.innerHTML = homeView();
  document.getElementById("settings-extra").innerHTML = avatarPickerView();
  updateTimeout();
}

// ---------- Buttons ----------
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, thread: threadId, reply: replyId } = el.dataset;
  const t = state.threads.find(x => x.id === threadId);
  const r = t && replyId ? t.replies.find(x => x.id === replyId) : null;
  const target = r || t;

  switch (action) {
    case "heart": {
      const i = target.hearts.indexOf(me().id);
      i === -1 ? target.hearts.push(me().id) : target.hearts.splice(i, 1);
      break;
    }
    case "report":
      target.reported = true;
      reportToLeader("reported", `${r ? r.body : t.title} (posted by ${nameOf(target.authorId)}, ${target.authorId})`, me().id, findBoard(t.board).name);
      showPopup(popups.reported);
      break;
    case "reply-to":
      replyingTo = replyingTo === replyId ? null : replyId;
      break;
    case "approve":
      target.status = "live";
      accountOf(target.authorId).approved++;
      break;
    case "reject":
      if (r) t.replies = t.replies.filter(x => x !== r && x.parent !== r.id);
      else state.threads = state.threads.filter(x => x !== t);
      break;
    case "pin":
      t.pinned = !t.pinned;
      break;
    case "lock":
    case "hide": {
      const key = action === "lock" ? "locked" : "hidden";
      if (target[key] !== null) {
        target[key] = null;
      } else {
        const note = await askNote(action === "lock" ? "Lock this thread" : "Hide this from kids");
        if (note === null) return;
        target[key] = note;
      }
      break;
    }
    case "remove": {
      const note = await askNote("Remove this thread");
      if (note === null) return;
      t.removed = note;
      save();
      location.hash = "#/board/" + t.board;
      return;
    }
    case "verify":
      r.verified = !r.verified;
      break;
    case "new-thread":
      showNewForm = !showNewForm;
      break;
    case "sort":
      sortMode = el.dataset.sort;
      break;
    case "view":
      viewMode = el.dataset.view;
      localStorage.setItem("pl-view", viewMode);
      replyingTo = null;
      break;
    case "avatar":
      me().avatar = el.dataset.avatar;
      break;
    case "change-name":
      openNameDialog();
      return;
    case "reset":
      localStorage.removeItem("pl-forum");
      localStorage.removeItem("pl-user-id");
      state = loadState();
      break;
  }
  save();
  render();
});

// ---------- Posting ----------
document.addEventListener("submit", e => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  if (timeLeft() > 0) return;

  const data = new FormData(form);
  const status = needsApproval() ? "pending" : "live";

  if (form.dataset.form === "thread") {
    const board = findBoard(form.dataset.board);
    const title = data.get("title").trim();
    const body = data.get("body").trim();
    if (!title || !body) return;

    const result = checkPost([title, body], board.name);
    if (!result) { save(); render(); return; }

    const t = makeThread({ board: board.id, title: result.texts[0], body: result.texts[1], tag: data.get("tag"), authorId: me().id, status });
    state.threads.push(t);
    showNewForm = false;
    save();
    location.hash = "#/thread/" + t.id;
    afterPost(result.slipped, status);
  } else {
    const t = state.threads.find(x => x.id === form.dataset.thread);
    const body = data.get("body").trim();
    if (!body) return;

    const result = checkPost([body], findBoard(t.board).name);
    if (!result) { save(); render(); return; }

    t.replies.push(makeReply({ parent: form.dataset.parent || null, body: result.texts[0], authorId: me().id, status }));
    replyingTo = null;
    save();
    render();
    afterPost(result.slipped, status);
  }
});

window.addEventListener("hashchange", () => {
  replyingTo = null;
  showNewForm = false;
  sortMode = "new";
  render();
  window.scrollTo(0, 0);
});

render();
setInterval(updateTimeout, 1000);
