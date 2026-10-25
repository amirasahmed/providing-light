// To add or change an event, edit this list.
// Each event automatically gets its own discussion thread on the Community page.
const events = [
  { id: "game-night", date: "2026-11-07", title: "Game Night", time: "6:00 – 8:00 PM", place: "Community Center, Room B" },
  { id: "art-workshop", date: "2026-11-15", title: "Art & Journaling Workshop", time: "2:00 – 4:00 PM", place: "Main Library" },
  { id: "food-drive", date: "2026-11-22", title: "Volunteer Day: Food Drive", time: "10:00 AM – 1:00 PM", place: "City Food Bank" },
  { id: "movie-night", date: "2026-12-05", title: "Winter Movie Night", time: "5:30 – 8:30 PM", place: "Community Center, Main Hall" },
];

function eventDate(e) {
  return new Date(e.date + "T12:00:00");
}

function formatEventDate(e) {
  return eventDate(e).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Today's date where the visitor is (not London time), as YYYY-MM-DD.
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// An event counts as past only once its day is over.
function isPast(e) {
  return e.date < todayLocal();
}

// Shows the event cards on the home page.
function showEvents() {
  const list = document.getElementById("event-list");
  if (!list) return;
  const upcoming = events.filter(e => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    list.innerHTML = "<p>No events right now. Check back soon!</p>";
    return;
  }

  for (const e of upcoming) {
    const d = eventDate(e);
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
        <a class="event-link" href="community.html#/thread/event-${e.id}">💬 Talk about it</a>
      </div>`;
    card.querySelector("h3").textContent = e.title;
    card.querySelector(".time").textContent = "🕒 " + e.time;
    card.querySelector(".place").textContent = "📍 " + e.place;
    list.appendChild(card);
  }
}

showEvents();
