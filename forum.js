// ---------- Settings ----------
const MAX_DEPTH = 3;                          // replies can nest this many levels deep
const SLIP_LIMIT = 3;                         // bad-word slips allowed in one day before a timeout
const SLIP_WINDOW = 24 * 60 * 60 * 1000;      // one day
const TIMEOUT_LENGTH = 10 * 60 * 1000;        // 10 minutes
const SPAM_LIMIT = 5;                         // more posts than this in SPAM_WINDOW...
const SPAM_WINDOW = 30 * 1000;                // ...30 seconds...
const SPAM_PAUSE = 60 * 1000;                 // ...pauses posting for 1 minute
const NAME_CHANGE_WAIT = 30 * 24 * 60 * 60 * 1000; // 30 days between name changes

const MOD_ID = "user_00001";
const MOD_CODE = "YAY-ISLAM"; // moderators sign in with this code

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
  return { id, name, role, history, avatar, lastNameChange: null, slips: [], timeoutUntil: 0 };
}

const accountOf = id => state.accounts[id] || { id, name: "Former member", role: "kid", history: [], avatar: "lantern" };
const nameOf = id => accountOf(id).name;

// Some browsers (like certain private modes) block saving. Then the demo still works, it just forgets on reload.
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};
let memoryUserId = null; // used when the browser won't save the account ID

let viewMode = store.get("pl-view") || "kid";
const isMod = () => viewMode === "mod";
const myAccount = () => state.accounts[store.get("pl-user-id") || memoryUserId];
const me = () => (isMod() ? state.accounts[MOD_ID] : myAccount());

// In the real version a parent creates the account. In the demo, one is made on your first visit.
function ensureMyAccount(s) {
  let id = store.get("pl-user-id") || memoryUserId;
  if (id && s.accounts[id]) return;
  do id = "user_" + Math.floor(10000 + Math.random() * 90000); while (s.accounts[id]);
  memoryUserId = id;
  store.set("pl-user-id", id);
  s.accounts[id] = makeAccount(id, randomName(s.accounts), "kid");
  s.accounts[id].created = Date.now(); // so new kids don't see notices from before they joined
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
    locked: null, hidden: null, removed: null, replies: o.replies || [],
  };
}

function makeReply(o) {
  return {
    id: o.id || newId(), parent: o.parent || null, body: o.body, authorId: o.authorId,
    time: o.time || Date.now(), hearts: o.hearts || [], verified: !!o.verified, hidden: null,
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
      body: "Assalamu alaikum and welcome!\n\nThis is a space to ask questions, share, and support each other. A few things to remember:\n• Stay anonymous. Never share your real name, school, or contact info.\n• Be kind. Bad words get hidden, and bullying is never okay.\n• Tap 🚩 if anything feels wrong.\n\nWe're so glad you're here." }),
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
  seedGroups(s);
  seedChat(s);
  const gameNight = s.threads.find(t => t.id === "event-game-night");
  if (gameNight) gameNight.replies.push(makeReply({ body: "Can we play Uno? 🃏", authorId: dove, time: hoursAgo(3), hearts: fakeHearts(3) }));
  return s;
}

// ---------- Groups ----------
// A private board for one in-person group. Members join with the code they get at their first meeting.
const MAX_CODE_TRIES = 5;                 // wrong codes allowed before joining pauses
const CODE_TRY_WINDOW = 15 * 60 * 1000;   // 15 minutes

// A new code keeps the day at the front (like SAT-7K4P) so it's easy to tell which program it's for.
function makeCode(g) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alikes like O/0 or I/1
  let code = g.day.slice(0, 3).toUpperCase() + "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const normalizeCode = c => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

function seedGroups(s) {
  s.groups = [
    { id: "group-sat", name: "Saturday Program", icon: "🌅", day: "Saturdays", desc: "The Saturday program's own space to plan, share, and keep talking between meetings.",
      code: "SAT-4821", members: ["user_31852", "user_47019", "user_48213", "user_72640", "user_38056"] },
    { id: "group-sun", name: "Sunday Program", icon: "☀️", day: "Sundays", desc: "The Sunday program's own space to plan, share, and keep talking between meetings.",
      code: "SUN-7350", members: ["user_25563", "user_60284", "user_19937"] },
    { id: "group-wed", name: "Wednesday Program", icon: "📚", day: "Wednesdays", desc: "The Wednesday program's own space for homework help, Quran review, and more.",
      code: "WED-1593", members: ["user_55108", "user_83391", "user_26774"] },
    { id: "group-thu", name: "Thursday Program", icon: "🌙", day: "Thursdays", desc: "The Thursday program's own space to plan, share, and keep talking between meetings.",
      code: "THU-2648", members: ["user_91425"] },
  ];
  const leaderHello = (g, h) => ({ id: newId(), authorId: MOD_ID, time: hoursAgo(h), hidden: null,
    text: `Assalamu alaikum, ${g.name}! 👋 This chat is just for our program. Say hi, plan, and keep in touch between meetings.` });
  for (const g of s.groups) g.chat = [leaderHello(g, 70)];
  s.groups[0].chat.push(
    { id: newId(), authorId: "user_31852", time: hoursAgo(5), hidden: null, text: "Is anyone else coming early this Saturday?" },
    { id: newId(), authorId: "user_48213", time: hoursAgo(4), hidden: null, text: "Me! I'll be there at 10 😄" },
  );
  s.groups[2].chat.push({ id: newId(), authorId: "user_55108", time: hoursAgo(8), hidden: null, text: "Don't forget, we're reviewing Al-Asr this week!" });

  const welcome = g => makeThread({ board: g.id, title: `Welcome to the ${g.name}! ${g.icon}`, tag: "Announcement", authorId: MOD_ID, pinned: true, time: hoursAgo(80),
    body: `This space is just for kids in the ${g.name}. Use it to plan, share, and keep talking between meetings. Same kindness rules as everywhere else 💛` });
  s.threads.push(
    ...s.groups.map(welcome),
    makeThread({ board: "group-sat", title: "Who's bringing snacks this week? 🍪", tag: "Fun", authorId: "user_47019", time: hoursAgo(6), hearts: fakeHearts(2),
      body: "I can bring juice. Anyone else?",
      replies: [
        makeReply({ body: "I'll bring dates!", authorId: "user_31852", time: hoursAgo(5), hearts: fakeHearts(1) }),
        makeReply({ body: "Cookies!! 🍪", authorId: "user_48213", time: hoursAgo(4), hearts: fakeHearts(3) }),
      ] }),
    makeThread({ board: "group-wed", title: "Which surahs are we reviewing next week?", authorId: "user_55108", time: hoursAgo(10),
      body: "I missed the end of class 😅",
      replies: [makeReply({ body: "Surah Al-Asr and Al-Kawthar! 📖", authorId: MOD_ID, time: hoursAgo(9), hearts: fakeHearts(2) })] }),
  );
}

// The All Programs chat: one big chat for kids from every program day.
function seedAllChat() {
  return [
    { id: newId(), authorId: MOD_ID, time: hoursAgo(60), hidden: null,
      text: "Welcome to the All Programs chat! 🌍 This is one big chat for kids from every program day. Say salam and meet kids from the other programs!" },
    { id: newId(), authorId: "user_47019", time: hoursAgo(9), hidden: null, text: "Hi from the Saturday program! 👋" },
    { id: newId(), authorId: "user_83391", time: hoursAgo(7), hidden: null, text: "Salam from Wednesday! Is anyone reading anything good?" },
    { id: newId(), authorId: "user_60284", time: hoursAgo(6), hidden: null, text: "I just finished a book of stories about the Prophets. So good!" },
  ];
}

// The help chat: one shared, public chat for questions about the app.
function seedChat(s) {
  s.chat = [
    { id: "chat-1", authorId: MOD_ID, time: hoursAgo(50), hidden: null,
      text: "Assalamu alaikum! 👋 Have a question about how the app works? Ask it here and a program leader will help. Everyone can see this chat." },
    { id: "chat-2", authorId: "user_60284", time: hoursAgo(20), hidden: null, text: "How do I change my profile picture?" },
    { id: "chat-3", authorId: MOD_ID, time: hoursAgo(19), hidden: null, text: "Tap the ⚙️ gear in the bottom corner! You can pick a new icon and a theme there." },
    { id: "chat-4", authorId: "user_19937", time: hoursAgo(3), hidden: null, text: "Where do I put my program code?" },
    { id: "chat-5", authorId: MOD_ID, time: hoursAgo(2), hidden: null, text: "On the Community page, tap 🔑 Join your program and type the code you got at your first meeting." },
  ];
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
    s = JSON.parse(store.get("pl-forum"));
  } catch {}
  if (!s || s.version !== 2) s = seedState();
  ensureEventThreads(s);
  // Saves from before program days existed: swap the old example groups for the four program days.
  if (!s.groups || !s.groups.some(g => g.id === "group-sat")) {
    const old = new Set((s.groups || []).map(g => g.id));
    s.threads = s.threads.filter(t => !old.has(t.board));
    seedGroups(s);
  }
  if (!s.chat) seedChat(s);
  for (const g of s.groups) g.chat ||= [];
  s.notices ||= []; // site-wide notices from moderators, like a changed program code
  s.allChat ||= seedAllChat();
  // Saves from when new members' posts needed approval: publish anything still waiting.
  for (const t of s.threads) {
    t.body = t.body.replace("\n• Your first 2 posts are checked by a moderator.", "");
    delete t.status;
    for (const r of t.replies) delete r.status;
  }
  ensureMyAccount(s);
  for (const acc of Object.values(s.accounts)) acc.avatar ||= avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
  return s;
}

state = loadState();
const save = () => store.set("pl-forum", JSON.stringify(state));
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
      /(\(\d{3}\)\s?|\b\d{3}[\s.-]?)\d{3}[\s.-]?\d{4}\b/.test(t) ||   // phone number like 555-123-4567
      /\b\d{3}[\s.-]\d{4}\b/.test(t) ||                           // short phone number like 123-4567
      /@\w{3,}/.test(t) ||                                        // @username
      /\b(instagram|insta|snapchat|tiktok|discord)\b/i.test(t) ||
      /\b(i live (at|on)|my address)\b/i.test(t) ||
      /\bmy school'?s name is\b/i.test(t) ||                      // naming a school, but not "my school is so hard"
      /\b(my school is|i go to|i attend)\s+([\w'.-]+\s+){1,4}(middle|high|elementary|academy|prep|intermediate|montessori)\b/i.test(t) },
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
  spam: { icon: "✋", title: "No spamming please", text: "That's a lot of messages really fast. Take a breath! You can post again in a minute." },
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

const timeLeft = () => (isMod() ? 0 : Math.max(me().timeoutUntil, me().spamUntil || 0) - Date.now());

// Spam limit: trying to post more than 20 times in 30 seconds pauses posting for a minute.
function hitSpamLimit() {
  if (isMod()) return false;
  const acc = me();
  const now = Date.now();
  acc.postTimes = (acc.postTimes || []).filter(t => now - t < SPAM_WINDOW);
  if (acc.postTimes.length < SPAM_LIMIT) {
    acc.postTimes.push(now);
    return false;
  }
  acc.postTimes = [];
  acc.spamUntil = now + SPAM_PAUSE;
  save();
  updateTimeout();
  showPopup(popups.spam);
  return true;
}

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

function afterPost(slipped) {
  if (slipped) showPopup(addSlip() ? popups.timeout : popups.mild);
  save();
  updateTimeout();
}

// Turns posting off during a timeout and shows a countdown.
function updateTimeout() {
  const banner = document.getElementById("timeout-banner");
  const left = timeLeft();
  document.querySelectorAll("[data-post-btn]").forEach(b => (b.disabled = left > 0));
  if (left > 0) {
    const min = Math.floor(left / 60000);
    const sec = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    banner.textContent = me().timeoutUntil > Date.now()
      ? `⏸️ Taking a short break. You can post again in ${min}:${sec}`
      : `✋ Slowing down for a minute. You can post again in ${min}:${sec}`;
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

// ---------- Joining your program ----------
let joinMessage = null; // { ok, text } shown on the join page after a try
let modMessage = null;  // same, for the moderator sign-in box

// Moderators sign in with the moderator code. Wrong tries count toward the same limit as program codes.
function tryModSignIn(raw) {
  const acc = myAccount();
  const now = Date.now();
  acc.codeTries = (acc.codeTries || []).filter(t => now - t < CODE_TRY_WINDOW);
  if (acc.codeTries.length >= MAX_CODE_TRIES) {
    return { ok: false, text: "Too many tries. Please wait a few minutes and try again." };
  }
  if (normalizeCode(raw) === normalizeCode(MOD_CODE)) {
    acc.codeTries = [];
    viewMode = "mod";
    store.set("pl-view", viewMode);
    return { ok: true };
  }
  acc.codeTries.push(now);
  if (acc.codeTries.length === MAX_CODE_TRIES) reportToLeader("codes", `${MAX_CODE_TRIES} wrong codes in a row (including moderator sign-in).`, acc.id);
  return { ok: false, text: acc.codeTries.length >= MAX_CODE_TRIES ? "Too many tries. Please wait a few minutes and try again." : "That moderator code didn't work." };
}

function modSignInForm(id) {
  const msg = modMessage;
  modMessage = null;
  return `
    <form class="join-form" data-form="mod-signin">
      <label for="${id}">Enter the moderator code</label>
      <div class="join-row">
        <input id="${id}" name="code" class="code-input" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-12345" required>
        <button class="btn btn-primary">Sign in</button>
      </div>
      ${msg ? `<p class="join-msg error" role="alert">${esc(msg.text)}</p>` : ""}
    </form>`;
}

// groupId (optional): only accept the code for that one program day.
function tryJoin(raw, groupId = null) {
  const acc = myAccount();
  const now = Date.now();
  acc.codeTries = (acc.codeTries || []).filter(t => now - t < CODE_TRY_WINDOW);

  if (acc.codeTries.length >= MAX_CODE_TRIES) {
    return { ok: false, text: "Too many tries. Please wait a few minutes and try again." };
  }

  const code = normalizeCode(raw);
  const group = state.groups.find(g => normalizeCode(g.code) === code && (!groupId || g.id === groupId));

  if (!group) {
    acc.codeTries.push(now);
    // Lots of wrong guesses could mean someone is trying to get into a program they're not in.
    if (acc.codeTries.length === MAX_CODE_TRIES) reportToLeader("codes", `${MAX_CODE_TRIES} wrong program codes in a row.`, acc.id);
    return {
      ok: false,
      text: acc.codeTries.length >= MAX_CODE_TRIES
        ? "Too many tries. Please wait a few minutes and try again."
        : groupId
          ? `That code didn't work for the ${findGroup(groupId).name}. Double-check it with your program leader.`
          : "That code didn't work. Double-check it with your program leader.",
    };
  }

  if (group.members.includes(acc.id)) return { ok: true, text: `You're already in the ${group.name}! ${group.icon}` };
  group.members.push(acc.id);
  acc.codeTries = [];
  return { ok: true, text: `Welcome to the ${group.name}! ${group.icon} Your program's board is unlocked below.` };
}

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

const allBoards = () => [...boards, ...state.groups.map(g => ({ ...g, group: true }))];
const findBoard = id => allBoards().find(b => b.id === id);
const findGroup = id => state.groups.find(g => g.id === id);
const inGroup = g => isMod() || g.members.includes(me().id);
const memberCount = g => `${g.members.length} member${g.members.length === 1 ? "" : "s"}`;
const canSeeBoard = b => !b.group || inGroup(b);
const liveReplies = t => t.replies.filter(r => r.hidden === null);
const isMine = post => post.authorId === me().id;

function canSeeThread(t) {
  const b = findBoard(t.board);
  if (!b || !canSeeBoard(b)) return false; // private group you're not in
  if (t.removed !== null) return true; // shows as a short "removed" note
  if (t.hidden !== null) return isMod();
  return true;
}


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
  return `
    <div class="whoami">
      ${isMod()
        ? `Posting as ${author(MOD_ID)}`
        : `Posting as ${avatar(me())}<strong>${esc(me().name)}</strong> <button class="link-btn" data-action="change-name">Change name</button>`}
    </div>
    <div class="toolbar-right">
      ${isMod() ? `<a class="mod-link" href="#/mod">🛡️ Moderator panel</a>` : ""}
      ${isMod()
        ? `<button class="chip-btn" data-action="mod-signout">Sign out of moderator</button>`
        : `<a class="mod-link" href="#/join">🛡️ Moderator sign-in</a>`}
    </div>`;
}

function homeView() {
  const weekly = state.threads.find(t => t.weekly && t.removed === null && t.hidden === null);
  const boardCard = b => {
    const count = state.threads.filter(t => t.board === b.id && canSeeThread(t) && t.removed === null).length;
    return `
      <a class="board-card" href="#/board/${b.id}">
        <span class="board-icon">${b.icon}</span>
        <div>
          <h3>${esc(b.name)}${b.modOnly ? ` <span class="mod-only">Moderators only</span>` : ""}${b.group ? ` <span class="mod-only">🔒 Private</span>` : ""}</h3>
          <p>${esc(b.desc)}</p>
          <span class="board-count">${count} thread${count === 1 ? "" : "s"}${b.group ? ` · ${memberCount(b)}` : ""}</span>
        </div>
      </a>`;
  };
  const myGroups = allBoards().filter(b => b.group && inGroup(b));

  return `
    <h1 class="page-title">Community</h1>
    <p class="section-intro">Pick a board, start a thread, and help each other out.</p>
    <a class="big-chat-card" href="#/chat/all">
      <span class="board-icon">🌍</span>
      <span class="big-chat-text">
        <strong>All Programs chat${unreadBadge(chatRoom("all"))}</strong>
        <span>One big chat for kids from every program day.</span>
      </span>
      <span class="weekly-cta">Open →</span>
    </a>
    <div class="quick-links">
      ${state.groups.filter(inGroup).map(g => `<a class="quick-link" href="#/chat/${g.id}"><span>${g.icon} ${esc(g.day.replace(/s$/, ""))} chat${unreadBadge(chatRoom(g.id))}</span><span>Talk with your program</span></a>`).join("")}
      <a class="quick-link" href="#/chat">💬 Help chat <span>Questions about the app</span></a>
      <a class="quick-link" href="#/join">🔑 ${isMod() ? "Program codes" : "Join your program"} <span>Sat · Sun · Wed · Thu</span></a>
    </div>
    ${weekly ? `
      <a class="weekly-card" href="#/thread/${weekly.id}">
        <span class="weekly-label">✨ This week's prompt</span>
        <strong>${esc(weekly.title.replace(/^Weekly prompt:\s*/, ""))}</strong>
        <span class="weekly-cta">Share yours →</span>
      </a>` : ""}
    <div class="board-grid">${boards.map(boardCard).join("")}</div>

    <h2 class="replies-title">🔑 ${isMod() ? "Programs" : "Your programs"}</h2>
    <p class="section-intro">Each program day has its own private board. Only kids in that program can see it.</p>
    <div class="board-grid">
      ${myGroups.map(boardCard).join("")}
      ${isMod() ? "" : `
        <a class="board-card join-card" href="#/join">
          <span class="board-icon">🔑</span>
          <div>
            <h3>Join your program</h3>
            <p>Saturday, Sunday, Wednesday, or Thursday? Enter the code from your first meeting.</p>
          </div>
        </a>`}
    </div>`;
}

function boardView(id) {
  const b = findBoard(id);
  if (!b) return homeView();
  if (!canSeeBoard(b)) {
    return `
      <a class="back" href="#/">← All boards</a>
      <div class="card empty">🔒 This is a private program board. If you're in this program, join with the code from your first meeting.
        <p><a class="btn btn-primary" href="#/join">🔑 Join your program</a></p>
      </div>`;
  }

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
    const hasVerified = t.replies.some(r => r.verified && r.hidden === null);
    return `
      <li class="thread-item ${t.hidden !== null ? "is-hidden" : ""}">
        <a href="#/thread/${t.id}">
          <div class="chips">
            ${t.pinned ? `<span class="chip-note">📌 Pinned</span>` : ""}
            ${tagChip(t.tag)}
            ${hasVerified ? `<span class="chip-note verified-chip">✅ Verified answer</span>` : ""}
            ${t.locked !== null ? `<span class="chip-note">🔒 Locked</span>` : ""}
            ${t.hidden !== null ? `<span class="chip-note">👁️ Hidden from kids</span>` : ""}
          </div>
          <h3>${esc(t.title)}</h3>
          <div class="meta">${esc(nameOf(t.authorId))} · ${timeAgo(t.time)} · 💬 ${count} · ❤️ ${t.hearts.length}</div>
        </a>
      </li>`;
  }).join("");

  return `
    <a class="back" href="#/">← All boards</a>
    <h1 class="page-title">${b.icon} ${esc(b.name)}</h1>
    <p class="section-intro">${esc(b.desc)}</p>
    ${b.group ? `<a class="btn btn-primary program-chat-btn" href="#/chat/${b.id}">💬 Open the ${esc(b.name)} chat${unreadBadge(chatRoom(b.id))}</a>` : ""}
    ${b.group ? `<p class="group-note">🔒 Private program · ${memberCount(b)}${isMod() ? ` · Code: <span class="code-chip">${esc(b.code)}</span>` : ""}</p>` : ""}

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

  const modTools = isMod() ? `
    <div class="mod-tools">
      <span class="mod-tools-label">🛡️</span>
      <button data-action="pin" data-thread="${t.id}">${t.pinned ? "Unpin" : "📌 Pin"}</button>
      <button data-action="lock" data-thread="${t.id}">${t.locked !== null ? "Unlock" : "🔒 Lock"}</button>
      <button data-action="hide" data-thread="${t.id}">${t.hidden !== null ? "Unhide" : "👁️ Hide"}</button>
      <button data-action="remove" data-thread="${t.id}">🗑️ Remove</button>
    </div>` : "";

  let replyArea;
  if (t.locked !== null) replyArea = "";
  else replyArea = `
    <form class="card composer" data-form="reply" data-thread="${t.id}">
      <label>Add a reply <textarea name="body" rows="3" maxlength="1000" required placeholder="Write something helpful and kind…"></textarea></label>
      <button class="btn btn-primary" data-post-btn>Reply</button>
    </form>`;

  return `
    <a class="back" href="#/board/${b.id}">← ${b.icon} ${esc(b.name)}</a>

    ${ev ? `
      <div class="event-box">
        <span>📅 <strong>${esc(ev.title)}</strong> · ${formatEventDate(ev)} · ${esc(ev.time)} · 📍 ${esc(ev.place)}</span>
        <span>${isPast(ev) ? "This event already happened. Share how it went!" : `<a href="index.html#events">See all events</a>`}</span>
      </div>` : ""}

    <article class="card post">
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
    .filter(r => r.parent === parentId)
    .sort((a, b) => (b.verified - a.verified) || (a.time - b.time));

  return list.map(r => {
    const hiddenForMe = r.hidden !== null && !isMod();
    const canReply = depth < MAX_DEPTH && t.locked === null && !hiddenForMe;
    const modTools = isMod() ? `
      <div class="mod-tools small">
        <button data-action="hide" data-thread="${t.id}" data-reply="${r.id}">${r.hidden !== null ? "Unhide" : "👁️ Hide"}</button>
        ${t.board === "deen" ? `<button data-action="verify" data-thread="${t.id}" data-reply="${r.id}">${r.verified ? "Remove verified" : "✅ Mark verified"}</button>` : ""}
      </div>` : "";

    return `
      <div class="reply ${r.verified ? "verified" : ""}">
        ${r.verified ? `<div class="verified-badge">✅ Verified answer</div>` : ""}
        <div class="meta">${author(r.authorId)} · ${timeAgo(r.time)}</div>
        ${hiddenForMe
          ? `<p class="stub">Hidden by a moderator${r.hidden ? `: ${esc(r.hidden)}` : "."}</p>`
          : `<p class="post-body">${esc(r.body)}</p>`}
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
  codes: "🔑 Lots of wrong program codes",
  timeout: "⏸️ Quiet note: timeout",
  reported: "🚩 Reported by a member",
};

function modView() {
  if (!isMod()) return `<a class="back" href="#/">← All boards</a><div class="card empty">This page is for moderators. <a href="#/join">🛡️ Sign in with the moderator code</a>.</div>`;

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
          <div><strong>${esc(a.name)}</strong> <span class="mod-id">${esc(a.id)}</span>${a.id === myId ? ` <span class="chip-note">(you, when signed out)</span>` : ""}</div>
          <div class="meta">
            Past names: ${a.history.length ? a.history.map(h => esc(h.name)).join(", ") : "none"} ·
            Programs: ${state.groups.filter(g => g.members.includes(a.id)).map(g => esc(g.name)).join(", ") || "none"} ·
            Slips today: ${a.slips.filter(t => Date.now() - t < SLIP_WINDOW).length} ·
            Safety reports: ${reports} · ${status}
          </div>
        </li>`;
    }).join("");

  return `
    <a class="back" href="#/">← All boards</a>
    <h1 class="page-title">🛡️ Moderator panel</h1>
    <p class="section-intro">Serious safety reports show up here right away, along with program codes and members.</p>

    <h2 class="replies-title">📣 Send an announcement</h2>
    <form class="card composer" data-form="announce">
      <label>Send to
        <select name="group">
          <option value="">All programs</option>
          ${state.groups.map(g => `<option value="${g.id}">${g.icon} ${esc(g.name)}</option>`).join("")}
        </select>
      </label>
      <label>Message
        <textarea id="announce-text" name="text" rows="3" maxlength="300" required placeholder="e.g. There's no program this week. See you next week! 💛"></textarea>
      </label>
      <div class="actions">
        <button type="button" class="chip-btn" data-action="announce-template">🚫 No program this week</button>
        <button type="button" class="chip-btn" data-action="announce-template" data-text="Reminder: our program starts at a different time this week. Check with your program leader for details.">⏰ Time change</button>
      </div>
      <button class="btn btn-primary">Send announcement</button>
      <p class="approval-note">Kids in that program see a banner on the home and Community pages, and it's posted in their program chat.</p>
    </form>
    ${state.notices.some(n => n.kind === "announcement") ? `
      <ul class="leader-log">
        ${state.notices.filter(n => n.kind === "announcement").map(n => `
          <li>
            <strong>${esc(noticeLabel(state, n))}</strong>
            <span>Sent ${timeAgo(n.time)}</span>
            <p><button class="chip-btn" data-action="remove-notice" data-notice="${n.id}">🗑️ Remove</button></p>
          </li>`).join("")}
      </ul>` : ""}

    <h2 class="replies-title">Safety reports (${state.log.length})</h2>
    <ul class="leader-log">${logItems || `<li class="empty">Nothing yet. Serious posts and repeated slips will show up here.</li>`}</ul>

    <h2 class="replies-title">Programs</h2>
    <p class="section-intro">Hand out each program's code at its first meeting. If a code gets out, make a new one: the old code stops working, and current members stay in.</p>
    <ul class="pending-list">${state.groups.map(g => `
      <li class="card">
        <div class="group-head">
          <strong>${g.icon} ${esc(g.name)}</strong>
          <span>Code: <span class="code-chip">${esc(g.code)}</span></span>
          <button class="chip-btn" data-action="new-code" data-group="${g.id}">🔄 New code</button>
        </div>
        <div class="member-chips">
          ${g.members.map(id => `<span class="member-chip">${avatar(accountOf(id))}${esc(nameOf(id))}<button data-action="remove-member" data-group="${g.id}" data-member="${id}" aria-label="Remove ${esc(nameOf(id))} from ${esc(g.name)}" title="Remove from group">✕</button></span>`).join("") || `<span class="chip-note">No members yet</span>`}
        </div>
      </li>`).join("")}
    </ul>

    <h2 class="replies-title">Members</h2>
    <p class="section-intro">Each member has a hidden ID that never changes. Names, warnings, and timeouts all stay attached to it.</p>
    <ul class="pending-list">${members}</ul>

    <button class="btn btn-ghost" data-action="reset">Reset demo</button>`;
}

function joinView() {
  const msg = joinMessage;
  joinMessage = null;
  const cards = state.groups.map(g => {
    const member = inGroup(g);
    return `
      <div class="program-card ${member ? "joined" : ""}">
        <span class="board-icon">${g.icon}</span>
        <div>
          <h3>${esc(g.name)}</h3>
          <p class="meta">${esc(g.day)} · ${memberCount(g)}</p>
          ${isMod()
            ? `<p>Code: <span class="code-chip">${esc(g.code)}</span> <button class="chip-btn" data-action="new-code" data-group="${g.id}">🔄 New code</button></p>`
            : member ? `<a class="event-link" href="#/board/${g.id}">✅ You're in · Open board →</a> <a class="event-link" href="#/chat/${g.id}">💬 Chat${unreadBadge(chatRoom(g.id))} →</a>` : `<p class="chip-note">🔒 Locked</p>`}
        </div>
      </div>`;
  }).join("");

  return `
    <a class="back" href="#/">← All boards</a>
    <h1 class="page-title">🔑 ${isMod() ? "Program codes" : "Join your program"}</h1>
    <p class="section-intro">${isMod()
      ? "Hand out each program's code at its first meeting. If a code gets out, make a new one: the old code stops working, and current members stay in."
      : "Each program day has its own private board. Type the code you got at your first meeting to unlock yours."}</p>
    ${isMod() ? `<p><a class="btn btn-primary" href="#/mod">📣 Send an announcement</a></p>` : ""}

    ${isMod() ? "" : `
      <form class="card join-form" data-form="join">
        <label for="join-code">Your program code</label>
        <div class="join-row">
          <input id="join-code" name="code" class="code-input" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-1234" required>
          <button class="btn btn-primary">Join</button>
        </div>
        ${msg ? `<p class="join-msg ${msg.ok ? "ok" : "error"}" role="alert">${esc(msg.text)}</p>` : ""}
      </form>`}

    <div class="program-grid">${cards}</div>

    ${isMod() ? "" : `
      <div class="card mod-signin">
        <h2 class="replies-title">🛡️ Moderator sign-in</h2>
        <p class="section-intro">Program leaders: sign in to see every program and the Moderator panel.</p>
        ${modSignInForm("mod-code")}
      </div>`}`;
}

// Every chat room: the help chat (no id), the All Programs chat ("all"), and one per program day.
function chatRoom(roomId) {
  if (!roomId) {
    return { id: "", name: "Help chat", title: "💬 Help chat", messages: state.chat, canUse: true, back: ["#/", "← All boards"],
      intro: "Questions about how the app works? Ask here and a program leader will help. Everyone can see this chat.",
      placeholder: isMod() ? "Answer a question…" : "Ask a question about the app…" };
  }
  if (roomId === "all") {
    return { id: "all", name: "All Programs chat", title: "🌍 All Programs chat", messages: state.allChat, canUse: !needsProgram(), back: ["#/", "← All boards"],
      intro: "One big chat for kids from every program day. Program leaders can see this chat too.",
      placeholder: "Message everyone…" };
  }
  const g = findGroup(roomId);
  if (!g) return null;
  return { id: g.id, name: `${g.name} chat`, title: `${g.icon} ${esc(g.name)} chat`, messages: g.chat, canUse: inGroup(g), back: [`#/board/${g.id}`, `← ${g.icon} ${esc(g.name)} board`],
    intro: `Chat with everyone in the ${esc(g.name)}. Program leaders can see this chat too.`,
    placeholder: "Message your program…" };
}

const allChatRooms = () => [chatRoom(""), chatRoom("all"), ...state.groups.map(g => chatRoom(g.id))];

function chatRoomName(msg) {
  return allChatRooms().find(r => r.messages.includes(msg)).name;
}

// In the All Programs chat, show which program days each kid is in.
function programTag(id) {
  const icons = state.groups.filter(g => g.members.includes(id)).map(g => `${g.icon} ${esc(g.day.replace(/s$/, "").slice(0, 3))}`);
  return icons.length ? ` <span class="chat-program">${icons.join(" · ")}</span>` : "";
}

function chatView(roomId) {
  const room = chatRoom(roomId);
  if (!room || !room.canUse) {
    return `
      <a class="back" href="#/">← All boards</a>
      <div class="card empty">🔒 This chat is only for kids in ${roomId === "all" ? "a program" : "that program"}. <a href="#/join">Join with your program's code</a>.</div>`;
  }
  const items = room.messages.map(m => {
    const acc = accountOf(m.authorId);
    const hiddenForMe = m.hidden !== null && !isMod();
    const tools = isMod()
      ? `<button class="chat-tool" data-action="hide-chat" data-msg="${m.id}">${m.hidden !== null ? "Unhide" : "👁️ Hide"}</button>`
      : (m.authorId !== me().id && acc.role === "kid" && !hiddenForMe
          ? (m.reported ? `<span class="chip-note">🚩</span>` : `<button class="chat-tool" data-action="report-chat" data-msg="${m.id}" title="Report this">🚩</button>`)
          : "");
    return `
      <div class="chat-msg ${m.authorId === me().id ? "mine" : ""} ${acc.role !== "kid" ? "leader" : ""} ${m.hidden !== null ? "is-hidden" : ""}">
        <div class="chat-meta">${author(m.authorId)}${room.id === "all" && acc.role === "kid" ? programTag(acc.id) : ""} · ${timeAgo(m.time)} ${tools}</div>
        <p>${hiddenForMe ? `<em>Removed by a moderator.</em>` : esc(m.text)}</p>
        ${m.hidden !== null && isMod() ? `<p class="chip-note">👁️ Hidden from kids</p>` : ""}
      </div>`;
  }).join("");

  return `
    <a class="back" href="${room.back[0]}">${room.back[1]}</a>
    <h1 class="page-title">${room.title}</h1>
    <p class="section-intro">${room.intro}</p>
    <div class="chat-box">
      <div class="chat-messages" id="chat-messages">${items || `<p class="empty">No messages yet. Say salam! 👋</p>`}</div>
      <form class="chat-form" data-form="chat" data-room="${room.id}">
        <label for="chat-input" class="visually-hidden">Your message</label>
        <input id="chat-input" name="body" maxlength="300" autocomplete="off" required placeholder="${room.placeholder}">
        <button class="btn btn-primary" data-post-btn>Send</button>
      </form>
    </div>`;
}

// Unread messages in a chat room: ones from other people since you last opened it.
function unreadCount(room) {
  const lastRead = (me().lastRead || {})[room.id] || 0;
  return room.messages.filter(m => m.time > lastRead && m.authorId !== me().id && m.hidden === null).length;
}

function unreadBadge(room) {
  const n = unreadCount(room);
  return n ? ` <span class="count" aria-label="${n} unread">${n} new</span>` : "";
}

// Notices from moderators that this kid hasn't dismissed yet.
function noticesView() {
  if (isMod()) return "";
  const acc = me();
  return visibleNotices(state, acc)
    .map(n => `
      <div class="notice-banner" role="status">
        <span>${esc(noticeLabel(state, n))}</span>
        <button class="btn btn-primary" data-action="dismiss-notice" data-notice="${n.id}">Got it</button>
      </div>`).join("");
}

// First visit: kids pick their program day and enter its code before seeing the community.
let gateDay = null;
const needsProgram = () => !isMod() && !state.groups.some(g => g.members.includes(me().id));

function gateView() {
  const msg = joinMessage;
  joinMessage = null;
  const picked = gateDay && gateDay !== "mod" && findGroup(gateDay);
  return `
    <div class="gate card">
      <div class="gate-icon">👋</div>
      <h1 class="page-title">Welcome to the community!</h1>
      <p class="section-intro">First, let's get you into your program. Which program day are you in?</p>
      <div class="day-grid" role="group" aria-label="Program day">
        ${state.groups.map(g => `
          <button type="button" class="day-choice ${gateDay === g.id ? "on" : ""}" data-action="pick-day" data-group="${g.id}" aria-pressed="${gateDay === g.id}">
            <span>${g.icon}</span>${esc(g.day.replace(/s$/, ""))}
          </button>`).join("")}
      </div>
      ${picked ? `
        <form class="join-form" data-form="gate">
          <label for="gate-code">Enter the code for the ${esc(picked.name)}</label>
          <div class="join-row">
            <input id="gate-code" name="code" class="code-input" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-1234" required>
            <button class="btn btn-primary">Join</button>
          </div>
          ${msg ? `<p class="join-msg ${msg.ok ? "ok" : "error"}" role="alert">${esc(msg.text)}</p>` : ""}
        </form>` : ""}
      <div class="mod-option">
        <button type="button" class="link-btn" data-action="pick-day" data-group="mod">🛡️ I'm a moderator</button>
      </div>
      ${gateDay === "mod" ? modSignInForm("gate-code") : ""}
      <p class="gate-help">You'll get your code at your first meeting. Stuck? <a href="#/chat">Ask in the help chat</a>.</p>
    </div>`;
}

function render() {
  const [, view, id] = (location.hash.slice(1) || "/").split("/");
  document.getElementById("notices").innerHTML = noticesView();
  document.getElementById("forum-toolbar").innerHTML = toolbarView();
  const forum = document.getElementById("forum");
  if (needsProgram() && view !== "chat") forum.innerHTML = gateView();
  else if (view === "board") forum.innerHTML = boardView(id);
  else if (view === "thread") forum.innerHTML = threadView(id);
  else if (view === "mod") forum.innerHTML = modView();
  else if (view === "join") forum.innerHTML = joinView();
  else if (view === "chat") {
    forum.innerHTML = chatView(id);
    // Opening a program chat (or the All Programs chat) marks its messages as read.
    const room = id && chatRoom(id);
    if (room && room.canUse) {
      (me().lastRead ||= {})[room.id] = Date.now();
      save();
    }
  }
  else forum.innerHTML = homeView();
  document.getElementById("settings-extra").innerHTML = avatarPickerView();
  updateTimeout();
  const gateInput = document.getElementById("gate-code");
  if (gateInput && !gateInput.value) gateInput.focus();
  const chatBox = document.getElementById("chat-messages");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

// ---------- Buttons ----------
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, thread: threadId, reply: replyId } = el.dataset;
  const t = state.threads.find(x => x.id === threadId);
  const r = t && replyId ? t.replies.find(x => x.id === replyId) : null;
  const target = r || t;
  const msg = el.dataset.msg && allChatRooms().flatMap(r => r.messages).find(m => m.id === el.dataset.msg);

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
    case "mod-signout":
      viewMode = "kid";
      store.set("pl-view", viewMode);
      replyingTo = null;
      save();
      if (location.hash && location.hash !== "#/") { location.hash = "#/"; return; }
      break;
    case "avatar":
      me().avatar = el.dataset.avatar;
      break;
    case "pick-day":
      gateDay = el.dataset.group;
      break;
    case "hide-chat":
      msg.hidden = msg.hidden === null ? "" : null;
      break;
    case "report-chat":
      msg.reported = true;
      reportToLeader("reported", `${msg.text} (posted by ${nameOf(msg.authorId)}, ${msg.authorId})`, me().id, chatRoomName(msg));
      showPopup(popups.reported);
      break;
    case "new-code": {
      if (!isMod()) return; // only moderators can change codes
      const g = findGroup(el.dataset.group);
      g.code = makeCode(g);
      // Tell everyone the code changed, without showing the new code.
      state.notices.unshift({ id: newId(), kind: "code", groupId: g.id, time: Date.now(),
        text: `The ${g.name} code was changed by a moderator. Already in the program? You don't need to do anything. New to it? Ask your program leader for the new code.` });
      showPopup({ icon: "🔑", title: "Code changed", text: `The new ${g.name} code is ${g.code}. Everyone on the site has been notified that it changed. Current members stay in.` });
      break;
    }
    case "announce-template":
      document.getElementById("announce-text").value = el.dataset.text || "There's no program this week. See you next week! 💛";
      return;
    case "remove-notice": {
      if (!isMod()) return;
      state.notices = state.notices.filter(n => n.id !== el.dataset.notice);
      // Take it out of the program chats too.
      for (const g of state.groups) g.chat = g.chat.filter(m => m.noticeId !== el.dataset.notice);
      state.allChat = state.allChat.filter(m => m.noticeId !== el.dataset.notice);
      break;
    }
    case "dismiss-notice":
      (me().seenNotices ||= []).push(el.dataset.notice);
      break;
    case "remove-member": {
      if (!isMod()) return;
      const g = findGroup(el.dataset.group);
      g.members = g.members.filter(id => id !== el.dataset.member);
      break;
    }
    case "change-name":
      openNameDialog();
      return;
    case "reset":
      store.remove("pl-forum");
      store.remove("pl-user-id");
      memoryUserId = null;
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
  const data = new FormData(form);

  if (form.dataset.form === "announce") {
    if (!isMod()) return;
    const text = data.get("text").trim();
    if (!text) return;
    const groupId = data.get("group") || null;
    const notice = { id: newId(), kind: "announcement", groupId, text, time: Date.now() };
    state.notices.unshift(notice);
    // Also post it in the program chat (or every program chat), so it stays there after the banner is dismissed.
    if (!groupId) state.allChat.push({ id: newId(), noticeId: notice.id, authorId: MOD_ID, text: "📣 " + text, time: Date.now(), hidden: null });
    for (const g of state.groups.filter(x => !groupId || x.id === groupId)) {
      g.chat.push({ id: newId(), noticeId: notice.id, authorId: MOD_ID, text: "📣 " + text, time: Date.now(), hidden: null });
    }
    save();
    render();
    const where = groupId ? `everyone in the ${findGroup(groupId).name}` : "everyone in every program";
    showPopup({ icon: "📣", title: "Announcement sent", text: `It's now showing for ${where}.` });
    return;
  }

  if (form.dataset.form === "mod-signin") {
    const result = tryModSignIn(data.get("code"));
    save();
    if (result.ok) {
      gateDay = null;
      showPopup({ icon: "🛡️", title: "Welcome, moderator!", text: "You now have full access to every program board and the Moderator panel." });
      if (location.hash && location.hash !== "#/") { location.hash = "#/"; return; }
    } else {
      modMessage = result;
    }
    render();
    return;
  }

  if (form.dataset.form === "gate") {
    const result = tryJoin(data.get("code"), gateDay);
    save();
    if (result.ok) {
      const g = findGroup(gateDay);
      gateDay = null;
      render();
      showPopup({ icon: g.icon, title: `Welcome to the ${g.name}!`, text: "You're all set. Explore the boards, say salam, and have fun! 🎉" });
    } else {
      joinMessage = result;
      render();
    }
    return;
  }

  if (form.dataset.form === "join") {
    joinMessage = tryJoin(data.get("code"));
    save();
    render();
    return;
  }

  if (timeLeft() > 0 || hitSpamLimit()) return;

  if (form.dataset.form === "chat") {
    const room = chatRoom(form.dataset.room);
    if (!room || !room.canUse) return;
    const body = data.get("body").trim();
    if (!body) return;
    const result = checkPost([body], room.name);
    if (!result) { save(); render(); return; }
    room.messages.push({ id: newId(), authorId: me().id, text: result.texts[0], time: Date.now(), hidden: null });
    save();
    render();
    document.getElementById("chat-input").focus();
    afterPost(result.slipped);
    return;
  }

  if (form.dataset.form === "thread") {
    const board = findBoard(form.dataset.board);
    const title = data.get("title").trim();
    const body = data.get("body").trim();
    if (!title || !body) return;

    const result = checkPost([title, body], board.name);
    if (!result) { save(); render(); return; }

    const t = makeThread({ board: board.id, title: result.texts[0], body: result.texts[1], tag: data.get("tag"), authorId: me().id });
    state.threads.push(t);
    showNewForm = false;
    save();
    location.hash = "#/thread/" + t.id;
    afterPost(result.slipped);
  } else {
    const t = state.threads.find(x => x.id === form.dataset.thread);
    const body = data.get("body").trim();
    if (!body) return;

    const result = checkPost([body], findBoard(t.board).name);
    if (!result) { save(); render(); return; }

    t.replies.push(makeReply({ parent: form.dataset.parent || null, body: result.texts[0], authorId: me().id }));
    replyingTo = null;
    save();
    render();
    afterPost(result.slipped);
  }
});

// If the site is open in another tab and something changes there, load it here too,
// so one tab never saves over what you did in the other.
window.addEventListener("storage", e => {
  if (e.key !== "pl-forum" && e.key !== "pl-view" && e.key !== "pl-user-id") return;
  viewMode = store.get("pl-view") || "kid";
  state = loadState();
  render();
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
