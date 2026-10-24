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
const blockedWords = ["stupid", "idiot", "dumb", "loser", "shut up", "hate you", "ugly", "kill yourself", "kys"];

function checkMessage(text) {
  const lower = text.toLowerCase();
  if (/\S+@\S+\.\S+/.test(text)) return "For your safety, emails can't be shared here.";
  if (/(\d[\s\-.()]*){7,}/.test(text)) return "For your safety, phone numbers can't be shared here.";
  if (/(instagram|snapchat|snap|tiktok|discord|insta)\b/.test(lower) || /@\w{3,}/.test(text))
    return "For your safety, please don't share social media accounts.";
  if (blockedWords.some(w => lower.includes(w))) return "Let's keep it kind. Please reword your message.";
  return null;
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
  saveMessages(currentRoom, msgs);
  showMessages();
}

function sendMessage(event) {
  event.preventDefault();
  const input = document.getElementById("chat-input");
  const warning = document.getElementById("chat-warning");
  const text = input.value.trim();
  if (!text) return;

  const problem = checkMessage(text);
  if (problem) {
    warning.textContent = problem;
    return;
  }

  warning.textContent = "";
  const msgs = loadMessages(currentRoom);
  msgs.push({ from: myName, text, time: Date.now() });
  saveMessages(currentRoom, msgs);
  input.value = "";
  showMessages();
}

function switchRoom(button) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t === button);
    t.setAttribute("aria-selected", t === button);
  });
  currentRoom = button.dataset.room;
  document.getElementById("chat-warning").textContent = "";
  showMessages();
}

// ---------- Start ----------
showEvents();
showMyName();
showMessages();

document.getElementById("chat-form").addEventListener("submit", sendMessage);
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchRoom(t)));
document.getElementById("new-name").addEventListener("click", () => {
  myName = randomName();
  localStorage.setItem("pl-name", myName);
  showMyName();
  showMessages();
});
