// ---------- Events ----------
// To add or change an event, edit this list.
const events = [
  { date: "2026-11-07", title: "Game Night", time: "6:00 – 8:00 PM", place: "Community Center, Room B" },
  { date: "2026-11-15", title: "Art & Journaling Workshop", time: "2:00 – 4:00 PM", place: "Main Library" },
  { date: "2026-11-22", title: "Volunteer Day: Food Drive", time: "10:00 AM – 1:00 PM", place: "City Food Bank" },
  { date: "2026-12-05", title: "Winter Movie Night", time: "5:30 – 8:30 PM", place: "Community Center, Main Hall" },
];

function showEvents() {
  const list = document.getElementById("event-list");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    list.innerHTML = "<p>No events right now. Check back soon!</p>";
    return;
  }

  for (const e of upcoming) {
    const d = new Date(e.date + "T12:00:00");
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-date">
        <span class="month">${d.toLocaleString("en-US", { month: "short" })}</span>
        <span class="day">${d.getDate()}</span>
      </div>
      <div>
        <h3></h3>
        <p class="time"></p>
        <p class="place"></p>
      </div>`;
    card.querySelector("h3").textContent = e.title;
    card.querySelector(".time").textContent = "🕒 " + e.time;
    card.querySelector(".place").textContent = "📍 " + e.place;
    list.appendChild(card);
  }
}

// ---------- Anonymous names ----------
const adjectives = ["Brave", "Sunny", "Kind", "Clever", "Calm", "Bright", "Gentle", "Bold", "Happy", "Swift"];
const animals = ["Owl", "Fox", "Panda", "Otter", "Tiger", "Koala", "Falcon", "Dolphin", "Bunny", "Turtle"];

function randomName() {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(adjectives)} ${pick(animals)} ${Math.floor(Math.random() * 90 + 10)}`;
}

let myName = localStorage.getItem("pl-name") || randomName();
localStorage.setItem("pl-name", myName);

function showMyName() {
  document.getElementById("my-name").textContent = myName;
}

// ---------- Safety checks ----------
// Step 1: mild bad words get replaced with *** before anyone sees them.
const mildWords = /\b(fuck\w*|shit\w*|bitch\w*|ass|asshole\w*|crap\w*|damn\w*|bastard\w*|dick\w*|piss\w*|stupid|idiot\w*|dumb|loser\w*)\b/gi;

// Step 4: serious messages are blocked and reported to a leader right away, even the first time.
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

// What the kid sees in the pop-up for each situation.
const popups = {
  mild: { icon: "🙂", title: "Hey, let's keep it clean", text: "Your message was sent, but some words were hidden. Remember our community guidelines!" },
  timeout: { icon: "⏸️", title: "Let's take a short break", text: "That's a few slips in a short time, so chat is paused for 10 minutes. Take a breather and come back soon. 💛" },
  bullying: { icon: "🛑", title: "That message wasn't sent", text: "It could hurt someone, so it was shared with a program leader. Everyone here deserves to feel safe." },
  hate: { icon: "🛑", title: "That message wasn't sent", text: "Hateful words aren't allowed here, so it was shared with a program leader." },
  "personal info": { icon: "🙈", title: "Let's keep you anonymous", text: "That looked like personal info (like a phone number, email, social media, or where you live), so it wasn't sent. A leader was let know, just to help keep you safe." },
  danger: { icon: "💛", title: "You're not alone", text: "It sounds like you might be going through something really hard. A program leader has been let know and will reach out. If you need help right now, call or text 988, any time." },
};

// Step 3: repeated slips. 3 in a day = a 10-minute timeout and a quiet note to the leader.
const SLIP_LIMIT = 3;
const SLIP_WINDOW = 24 * 60 * 60 * 1000; // one day
const TIMEOUT_LENGTH = 10 * 60 * 1000;   // 10 minutes

function addSlip() {
  const now = Date.now();
  const slips = JSON.parse(localStorage.getItem("pl-slips") || "[]").filter(t => now - t < SLIP_WINDOW);
  slips.push(now);

  if (slips.length >= SLIP_LIMIT) {
    localStorage.setItem("pl-slips", "[]");
    localStorage.setItem("pl-timeout-until", now + TIMEOUT_LENGTH);
    reportToLeader("timeout", `${SLIP_LIMIT} slips in one day. Paused from chat for 10 minutes.`);
    updateTimeout();
    return true;
  }
  localStorage.setItem("pl-slips", JSON.stringify(slips));
  return false;
}

function timeLeft() {
  return Number(localStorage.getItem("pl-timeout-until") || 0) - Date.now();
}

// Turns the chat box off during a timeout and shows a countdown.
function updateTimeout() {
  const input = document.getElementById("chat-input");
  const button = document.querySelector("#chat-form button");
  const warning = document.getElementById("chat-warning");
  const left = timeLeft();

  if (left > 0) {
    const min = Math.floor(left / 60000);
    const sec = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    input.disabled = button.disabled = true;
    input.placeholder = "Taking a short break…";
    warning.textContent = `⏸️ You can chat again in ${min}:${sec}`;
  } else if (input.disabled) {
    input.disabled = button.disabled = false;
    input.placeholder = "Type a kind message…";
    warning.textContent = "";
  }
}

// ---------- Leader notes (shown in the demo "leader view") ----------
const logLabels = {
  danger: "🚨 Urgent: may be in danger",
  bullying: "🛑 Bullying or threat",
  hate: "🛑 Hate speech",
  "personal info": "🙈 Shared personal info",
  timeout: "⏸️ Quiet note: timeout",
  reported: "🚩 Reported by another user",
};

function reportToLeader(type, text) {
  const log = JSON.parse(localStorage.getItem("pl-leader-log") || "[]");
  log.unshift({ type, text, from: myName, room: currentRoom, time: Date.now() });
  localStorage.setItem("pl-leader-log", JSON.stringify(log));
  showLeaderLog();
}

function showLeaderLog() {
  const list = document.getElementById("leader-log");
  const log = JSON.parse(localStorage.getItem("pl-leader-log") || "[]");
  list.innerHTML = "";

  if (log.length === 0) {
    list.innerHTML = "<li class='empty'>Nothing yet. Try typing a bad word or a phone number in the chat.</li>";
    return;
  }

  for (const entry of log) {
    const li = document.createElement("li");
    li.className = entry.type === "danger" ? "urgent" : "";
    const head = document.createElement("strong");
    head.textContent = logLabels[entry.type];
    const meta = document.createElement("span");
    const room = entry.room === "leader" ? "leader chat" : "group chat";
    meta.textContent = `${entry.from} · ${room} · ${new Date(entry.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    const body = document.createElement("p");
    body.textContent = entry.text;
    li.append(head, meta, body);
    list.appendChild(li);
  }
}

// ---------- Pop-up ----------
function showPopup(p, offerLeaderChat = false) {
  document.getElementById("popup-icon").textContent = p.icon;
  document.getElementById("popup-title").textContent = p.title;
  document.getElementById("popup-text").textContent = p.text;
  document.getElementById("popup-leader").hidden = !offerLeaderChat;
  document.getElementById("popup").showModal();
}

// ---------- Chat ----------
const rooms = {
  group: {
    desc: "Everyone can see these messages. A program leader is watching to keep things safe.",
    welcome: "Welcome to the group chat! Be kind, stay anonymous, and have fun. 💛",
  },
  leader: {
    desc: "Private: only you and a program leader can see this conversation.",
    welcome: "Hi! I'm a program leader. You can talk to me about anything. What's on your mind?",
  },
};

let currentRoom = "group";

function loadMessages(room) {
  return JSON.parse(localStorage.getItem("pl-chat-" + room) || "[]");
}

function saveMessages(room, msgs) {
  localStorage.setItem("pl-chat-" + room, JSON.stringify(msgs));
}

function showMessages() {
  const box = document.getElementById("messages");
  box.innerHTML = "";
  document.getElementById("room-desc").textContent = rooms[currentRoom].desc;

  const msgs = [{ from: "Program Leader", text: rooms[currentRoom].welcome, leader: true }, ...loadMessages(currentRoom)];

  msgs.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "msg" + (m.leader ? " leader" : "") + (m.from === myName ? " mine" : "") + (m.reported ? " reported" : "");

    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const who = document.createElement("span");
    who.textContent = m.leader ? "⭐ " + m.from : m.from;
    meta.appendChild(who);

    if (!m.leader && m.from !== myName && !m.reported) {
      const flag = document.createElement("button");
      flag.className = "report-btn";
      flag.textContent = "🚩";
      flag.title = "Report this message";
      flag.onclick = () => reportMessage(i - 1);
      meta.appendChild(flag);
    }

    const body = document.createElement("div");
    body.textContent = m.reported ? "This message was reported and is being reviewed." : m.text;

    div.append(meta, body);
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

function reportMessage(index) {
  const msgs = loadMessages(currentRoom);
  msgs[index].reported = true;
  reportToLeader("reported", `"${msgs[index].text}" (from ${msgs[index].from})`);
  saveMessages(currentRoom, msgs);
  showMessages();
}

function postMessage(text) {
  const msgs = loadMessages(currentRoom);
  msgs.push({ from: myName, text, time: Date.now() });
  saveMessages(currentRoom, msgs);
  showMessages();
}

function sendMessage(event) {
  event.preventDefault();
  if (timeLeft() > 0) return;
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const serious = findSerious(text);
  if (serious) {
    reportToLeader(serious, text);
    if (serious === "danger") {
      // In the private chat the leader needs to see this, so it goes through.
      if (currentRoom === "leader") postMessage(text);
      showPopup(popups.danger, currentRoom === "group");
      return;
    }
    const timedOut = (serious === "bullying" || serious === "hate") && addSlip();
    showPopup(timedOut ? popups.timeout : popups[serious]);
    return;
  }

  const clean = text.replace(mildWords, w => "*".repeat(w.length));
  postMessage(clean);
  if (clean !== text) {
    showPopup(addSlip() ? popups.timeout : popups.mild);
  }
}

function switchRoom(button) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t === button);
    t.setAttribute("aria-selected", t === button);
  });
  currentRoom = button.dataset.room;
  if (timeLeft() <= 0) document.getElementById("chat-warning").textContent = "";
  showMessages();
}

// ---------- Start ----------
showEvents();
showMyName();
showMessages();
showLeaderLog();
updateTimeout();
setInterval(updateTimeout, 1000);

document.getElementById("chat-form").addEventListener("submit", sendMessage);
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchRoom(t)));
document.getElementById("new-name").addEventListener("click", () => {
  myName = randomName();
  localStorage.setItem("pl-name", myName);
  showMyName();
  showMessages();
});
document.getElementById("popup-ok").addEventListener("click", () => document.getElementById("popup").close());
document.getElementById("popup-leader").addEventListener("click", () => {
  document.getElementById("popup").close();
  switchRoom(document.querySelector('.tab[data-room="leader"]'));
});
document.getElementById("reset-demo").addEventListener("click", () => {
  ["pl-chat-group", "pl-chat-leader", "pl-slips", "pl-timeout-until", "pl-leader-log"].forEach(k => localStorage.removeItem(k));
  updateTimeout();
  showMessages();
  showLeaderLog();
});
