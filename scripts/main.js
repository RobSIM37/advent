const calendarGrid = document.getElementById("calendar-grid");
const hero = document.getElementById("hero");
const heroDay = document.getElementById("hero-day");
const heroTitle = document.getElementById("hero-title");
const heroMessage = document.getElementById("hero-message");
const heroPlayer = document.getElementById("hero-player");
const heroClose = document.getElementById("hero-close");
const heroCard = document.querySelector(".hero__card");
const heroBackdrop = document.querySelector(".hero__backdrop");
const subtitle = document.getElementById("subtitle-text");
const snowLayer = document.getElementById("snow-layer");

const STORAGE_KEY = "advent-opened-days";

let videoPool = [
  "dQw4w9WgXcQ",
  "B7bqAsxee4I",
  "1G4isv_Fylg",
  "ktvTqknDobU",
  "R4fSAS4l6tk",
  "UVxG7geXKEg",
  "HgzGwKwLmgM",
  "HHP5MKgK0o8",
  "ysSxxIqKNN0",
];

let days = [];

const loadOpened = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Unable to read opened days; starting fresh.", error);
    return new Set();
  }
};

const saveOpened = (openedSet) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openedSet)));
  } catch (error) {
    console.warn("Unable to persist opened days.", error);
  }
};

const openedDays = loadOpened();

const GRID_COLS = 7;
const occupancy = [];
const placements = [];

const ensureRows = (rowsNeeded) => {
  while (occupancy.length < rowsNeeded) {
    occupancy.push(new Array(GRID_COLS).fill(false));
  }
};

const canPlace = (row, col, rowSpan, colSpan) => {
  ensureRows(row + rowSpan);
  for (let r = row; r < row + rowSpan; r += 1) {
    for (let c = col; c < col + colSpan; c += 1) {
      if (occupancy[r][c]) return false;
    }
  }
  return true;
};

const reserve = (row, col, rowSpan, colSpan) => {
  ensureRows(row + rowSpan);
  for (let r = row; r < row + rowSpan; r += 1) {
    for (let c = col; c < col + colSpan; c += 1) {
      occupancy[r][c] = true;
    }
  }
};

const placeWindow = (colSpan, rowSpan) => {
  let row = 0;
  while (true) {
    for (let col = 0; col <= GRID_COLS - colSpan; col += 1) {
      if (canPlace(row, col, rowSpan, colSpan)) {
        reserve(row, col, rowSpan, colSpan);
        return { row, col };
      }
    }
    row += 1;
  }
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const updateSubtitle = () => {
  if (!subtitle) return;
  const now = new Date();
  const decFirst = new Date(now.getFullYear(), 11, 1);
  const beforeDecember = now < decFirst;

  if (beforeDecember) {
    const diffDays = Math.max(
      1,
      Math.ceil((decFirst.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    subtitle.textContent =
      diffDays === 1
        ? "1 day until December 1—countdown begins!"
        : `${diffDays} days until December 1st!`;
    return;
  }

  const available = days.filter((day) => day.unlocked && !openedDays.has(day.day)).length;
  if (available === 0) {
    subtitle.textContent = "Revisit some of your favorites!";
  } else if (available === 1) {
    subtitle.textContent = "Open the window to reveal today's cheer!";
  } else {
    subtitle.textContent = "Open a window to reveal some cheer!";
  }
};

const randomSize = () => {
  const colSpan = Math.random() < 0.18 ? 2 : 1;
  const rowSpan = Math.random() < 0.12 ? 2 : 1;
  return { colSpan, rowSpan };
};

const createWindow = (day) => {
  const button = document.createElement("button");
  const isOpened = openedDays.has(day.day);
  const classes = ["window"];
  if (!day.unlocked) {
    classes.push("window--locked");
  } else if (isOpened) {
    classes.push("window--opened");
  } else {
    classes.push("window--ready");
  }

  button.className = classes.join(" ");
  button.type = "button";
  button.dataset.day = day.day;

  const { colSpan, rowSpan } = randomSize();
  const { row, col } = placeWindow(colSpan, rowSpan);
  button.style.gridColumn = `${col + 1} / span ${colSpan}`;
  button.style.gridRow = `${row + 1} / span ${rowSpan}`;
  placements.push({ button, row, col, colSpan, rowSpan });

  const pill = document.createElement("span");
  pill.className = "window__pill";
  pill.textContent = !day.unlocked ? "Locked" : isOpened ? "Opened" : "Open me";

  const label = document.createElement("div");
  label.className = "window__label";
  label.textContent = day.day;

  button.append(pill, label);

  const markOpened = () => {
    if (openedDays.has(day.day)) return;
    openedDays.add(day.day);
    saveOpened(openedDays);
    button.classList.remove("window--ready");
    button.classList.add("window--opened");
    pill.textContent = "Opened";
    updateSubtitle();
  };

  if (day.unlocked) {
    button.addEventListener("click", () => {
      openHero(day, button);
      markOpened();
    });
  }

  return button;
};

const computeRowOffsets = () => {
  return occupancy.map((row) => {
    const used = row.reduce((count, cell) => count + (cell ? 1 : 0), 0);
    const offset = Math.floor((GRID_COLS - used) / 2);
    return offset > 0 ? offset : 0;
  });
};

const applyRowOffsets = () => {
  const offsets = computeRowOffsets();
  placements.forEach(({ button, row, col, colSpan }) => {
    const offset = offsets[row] || 0;
    button.style.gridColumn = `${col + offset + 1} / span ${colSpan}`;
  });
};

const animateHeroIn = (origin) => {
  hero.classList.remove("hidden");
  heroCard.style.transition = "none";
  heroBackdrop.style.transition = "none";
  heroBackdrop.style.opacity = "0";

  const originRect = origin.getBoundingClientRect();
  const targetRect = heroCard.getBoundingClientRect();
  const deltaX = originRect.left - targetRect.left;
  const deltaY = originRect.top - targetRect.top;
  const scaleX = originRect.width / targetRect.width;
  const scaleY = originRect.height / targetRect.height;

  heroCard.style.transformOrigin = "top left";
  heroCard.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
  heroCard.style.opacity = "0.7";

  requestAnimationFrame(() => {
    heroCard.style.transition = "transform 260ms ease, opacity 220ms ease";
    heroBackdrop.style.transition = "opacity 220ms ease";
    heroCard.style.transform = "translate(0, 0) scale(1)";
    heroCard.style.opacity = "1";
    heroBackdrop.style.opacity = "1";
  });

  const cleanup = () => {
    heroCard.style.transition = "";
    heroBackdrop.style.transition = "";
    heroCard.removeEventListener("transitionend", cleanup);
  };

  heroCard.addEventListener("transitionend", cleanup);
};

const animateHeroOut = () => {
  heroCard.style.transition = "transform 200ms ease, opacity 180ms ease";
  heroBackdrop.style.transition = "opacity 180ms ease";
  heroCard.style.transform = "translate(0, -6px) scale(0.96)";
  heroCard.style.opacity = "0";
  heroBackdrop.style.opacity = "0";

  const cleanup = () => {
    heroCard.style.transition = "";
    heroBackdrop.style.transition = "";
    heroCard.style.transform = "";
    heroCard.style.opacity = "";
    heroBackdrop.style.opacity = "";
    hero.classList.add("hidden");
    clearPlayer();
    heroCard.removeEventListener("transitionend", cleanup);
  };

  heroCard.addEventListener("transitionend", cleanup);
};

const isUnlocked = (dayNumber) => {
  const now = new Date();
  const isDecember = now.getMonth() === 11; // 0-indexed months
  if (!isDecember) return false;
  return dayNumber <= now.getDate();
};

const buildDays = () => {
  days = Array.from({ length: 25 }, (_, index) => {
    const dayNumber = index + 1;
    return {
      day: dayNumber,
      unlocked: isUnlocked(dayNumber),
      title: `Window ${dayNumber}`,
      message: videoPool[(dayNumber - 1) % videoPool.length],
      videoId: videoPool[(dayNumber - 1) % videoPool.length],
    };
  });
};

const renderCalendar = () => {
  occupancy.length = 0;
  placements.length = 0;
  calendarGrid.innerHTML = "";
  shuffle(days).forEach((day) => {
    calendarGrid.appendChild(createWindow(day));
  });
  applyRowOffsets();
  updateSubtitle();
};

const clearPlayer = () => {
  heroPlayer.innerHTML = "";
};

const openHero = (day, origin) => {
  heroDay.textContent = `Day ${day.day}`;
  heroTitle.textContent = day.title;
  heroMessage.textContent = day.message || "";
  clearPlayer();

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${day.videoId}?autoplay=1&rel=0`;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  heroPlayer.appendChild(iframe);

  animateHeroIn(origin);
};

const closeHero = () => {
  animateHeroOut();
};

heroClose.addEventListener("click", closeHero);
hero.addEventListener("click", (event) => {
  const target = event.target;
  if (target === hero || target.classList.contains("hero__backdrop")) {
    closeHero();
  }
});

const loadVideoContent = async () => {
  try {
    const response = await fetch("content/content.json", { cache: "no-cache" });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      videoPool = data;
    }
  } catch (error) {
    console.warn("Falling back to default videos; unable to load content.json", error);
  }
};

const spawnSnow = () => {
  if (!snowLayer) return;
  const flakeCount = 140;
  snowLayer.innerHTML = "";
  for (let i = 0; i < flakeCount; i += 1) {
    const flake = document.createElement("span");
    const isBranch = Math.random() < 0.22;
    flake.className = isBranch ? "snowflake snowflake--branch" : "snowflake";
    const size = isBranch ? 8 + Math.random() * 10 : 2 + Math.random() * 4;
    const duration = 5 + Math.random() * 6;
    const delay = Math.random() * 6;
    const startX = Math.random() * 100;
    const endX = startX + (Math.random() * 20 - 10);
    flake.style.setProperty("--size", `${size}px`);
    flake.style.setProperty("--duration", `${duration}s`);
    flake.style.setProperty("--delay", `${delay}s`);
    flake.style.setProperty("--start-x", `${startX}vw`);
    flake.style.setProperty("--end-x", `${endX}vw`);
    flake.style.left = `${startX}vw`;
    snowLayer.appendChild(flake);
  }
};

const init = async () => {
  await loadVideoContent();
  buildDays();
  renderCalendar();
  updateSubtitle();
  spawnSnow();
};

init();
