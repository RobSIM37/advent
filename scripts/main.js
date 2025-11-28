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
const snowSettingsBtn = document.getElementById("snow-settings-btn");
const snowModal = document.getElementById("snow-modal");
const snowModalBackdrop = document.getElementById("snow-modal-backdrop");
const snowSettingsForm = document.getElementById("snow-form");
const snowClose = document.getElementById("snow-close");
const snowCancel = document.getElementById("snow-cancel");
const snowMinInput = document.getElementById("snow-min-size");
const snowMaxInput = document.getElementById("snow-max-size");
const snowSpeedInput = document.getElementById("snow-fall-speed");
const snowDensityInput = document.getElementById("snow-density");
const snowWindInput = document.getElementById("snow-wind");
const snowPointThresholdInput = document.getElementById("snow-point-threshold");

const STORAGE_KEY = "advent-opened-days";
const SNOW_SETTINGS_KEY = "advent-snow-settings";
const defaultSnowSettings = {
  minSize: 2,
  maxSize: 14,
  fallSpeed: 9,
  snowDensity: 140,
  windSheer: 0,
  pointThreshold: 12,
};

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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeSnowSettings = (settings) => {
  const minSize = clamp(Number(settings.minSize) || defaultSnowSettings.minSize, 1, 60);
  const maxSize = clamp(
    Number(settings.maxSize) || defaultSnowSettings.maxSize,
    minSize + 1,
    80
  );
  const fallSpeed = clamp(
    Number(settings.fallSpeed) || defaultSnowSettings.fallSpeed,
    2,
    20
  );
  const snowDensity = clamp(
    Number(settings.snowDensity) || defaultSnowSettings.snowDensity,
    20,
    400
  );
  const windSheer = clamp(
    Number(settings.windSheer) || defaultSnowSettings.windSheer,
    -120,
    120
  );
  const pointThreshold = clamp(
    Number(settings.pointThreshold) || defaultSnowSettings.pointThreshold,
    minSize,
    maxSize
  );
  return { minSize, maxSize, fallSpeed, snowDensity, windSheer, pointThreshold };
};

const loadSnowSettings = () => {
  try {
    const raw = localStorage.getItem(SNOW_SETTINGS_KEY);
    if (!raw) return { ...defaultSnowSettings };
    const parsed = JSON.parse(raw);
    return normalizeSnowSettings({ ...defaultSnowSettings, ...parsed });
  } catch (error) {
    console.warn("Unable to read snow settings; using defaults.", error);
    return { ...defaultSnowSettings };
  }
};

const saveSnowSettings = (settings) => {
  try {
    localStorage.setItem(SNOW_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Unable to save snow settings.", error);
  }
};

let snowSettings = loadSnowSettings();

const GRID_COLS = 7;
const occupancy = [];
const placements = [];
let windowSizes = [];

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
        ? "1 day until December 1st!"
        : `${diffDays} days until December 1st!`;
    subtitle.classList.remove("subtitle--loading");
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
  subtitle.classList.remove("subtitle--loading");
};

const buildWindowSizes = (count) => {
  const targetRows = Math.random() < 0.5 ? 4 : 5;
  const targetArea = targetRows * GRID_COLS;
  const sizes = Array.from({ length: count }, () => ({ colSpan: 1, rowSpan: 1 }));
  let currentArea = count;
  const basePool = sizes.map((_, index) => index);
  const getPool = () =>
    basePool.filter((idx) => sizes[idx].colSpan === 1 && sizes[idx].rowSpan === 1);
  let available = [...getPool()];

  while (currentArea < targetArea && available.length) {
    const remaining = targetArea - currentArea;
    const idx = available.splice(Math.floor(Math.random() * available.length), 1)[0];
    const options = [];
    if (remaining >= 3) options.push({ colSpan: 2, rowSpan: 2 });
    if (remaining >= 1) {
      options.push({ colSpan: 2, rowSpan: 1 });
      options.push({ colSpan: 1, rowSpan: 2 });
    }
    if (!options.length) break;
    const choice = options[Math.floor(Math.random() * options.length)];
    const added = choice.colSpan * choice.rowSpan - 1;
    if (added <= remaining) {
      sizes[idx] = choice;
      currentArea += added;
    }
    if (!available.length && currentArea < targetArea) {
      available = [...getPool()];
    }
  }

  return { sizes, targetRows };
};

const tryPlanLayout = (sizes, targetRows) => {
  occupancy.length = 0;
  ensureRows(targetRows);

  const canPlaceBounded = (row, col, rowSpan, colSpan) => {
    if (row + rowSpan > targetRows) return false;
    if (col + colSpan > GRID_COLS) return false;
    return canPlace(row, col, rowSpan, colSpan);
  };

  const plan = [];
  for (let index = 0; index < sizes.length; index += 1) {
    const { colSpan, rowSpan } = sizes[index];
    let placed = false;
    for (let r = 0; r < targetRows; r += 1) {
      for (let c = 0; c <= GRID_COLS - colSpan; c += 1) {
        if (canPlaceBounded(r, c, rowSpan, colSpan)) {
          plan.push({ row: r, col: c, colSpan, rowSpan });
          reserve(r, c, rowSpan, colSpan);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (!placed) return null;
  }

  return plan;
};

const createWindow = (day, size) => {
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

  const { colSpan, rowSpan, row, col } = size || {
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  };
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
  calendarGrid.innerHTML = "";
  placements.length = 0;
  const { sizes, targetRows } = buildWindowSizes(days.length);
  let plan = null;

  for (let attempt = 0; attempt < 30 && !plan; attempt += 1) {
    const shuffledSizes = shuffle([...sizes]);
    plan = tryPlanLayout(shuffledSizes, targetRows);
    if (plan) {
      windowSizes = shuffledSizes.map((size, index) => ({
        ...size,
        row: plan[index].row,
        col: plan[index].col,
      }));
    }
  }

  if (!plan) {
    occupancy.length = 0;
    placements.length = 0;
    ensureRows(targetRows);
    windowSizes = sizes.map((size, index) => ({
      ...size,
      row: Math.floor(index / GRID_COLS),
      col: index % GRID_COLS,
      colSpan: 1,
      rowSpan: 1,
    }));
    windowSizes.forEach(({ row, col, rowSpan, colSpan }) => {
      reserve(row, col, rowSpan, colSpan);
    });
  }

  shuffle(days).forEach((day, index) => {
    calendarGrid.appendChild(createWindow(day, windowSizes[index]));
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

const setSnowFormValues = (settings) => {
  if (!snowSettingsForm) return;
  snowMinInput.value = settings.minSize;
  snowMaxInput.value = settings.maxSize;
  snowSpeedInput.value = settings.fallSpeed;
  snowDensityInput.value = settings.snowDensity;
  snowWindInput.value = settings.windSheer;
  snowPointThresholdInput.value = settings.pointThreshold;
};

const openSnowModal = () => {
  if (!snowModal) return;
  setSnowFormValues(snowSettings);
  snowModal.classList.remove("hidden");
  snowModal.setAttribute("aria-hidden", "false");
};

const closeSnowModal = () => {
  if (!snowModal) return;
  snowModal.classList.add("hidden");
  snowModal.setAttribute("aria-hidden", "true");
};

const spawnSnow = () => {
  if (!snowLayer) return;
  const { minSize, maxSize, fallSpeed, snowDensity, windSheer } = snowSettings;
  const flakeCount = Math.round(snowDensity);
  snowLayer.innerHTML = "";
  for (let i = 0; i < flakeCount; i += 1) {
    const flake = document.createElement("span");
    const size = minSize + Math.random() * (maxSize - minSize);
    const isBranch = size >= snowSettings.pointThreshold;
    flake.className = isBranch ? "snowflake snowflake--branch" : "snowflake";
    const branchSize = clamp(size + 4, minSize, maxSize + 6);
    const thickness = clamp(size * 0.22, 2, 8);
    const duration = Math.max(2, fallSpeed + (Math.random() * 4 - 2));
    const delay = Math.random() * 6;
    const drift = Math.random() * 24 - 12 + windSheer;
    const windFactor = Math.min(1, Math.abs(windSheer) / 80);
    const buffer = 30 + windFactor * 30; // widen spawn band outside viewport
    const upwindBias = 0.2 + windFactor * 0.25;
    let startX = -buffer + Math.random() * (100 + buffer * 2); // spread broadly across the top
    const shouldBias = Math.random() < upwindBias;
    if (windSheer > 0 && shouldBias) {
      startX = -buffer + Math.random() * buffer * 1.6; // enter from left
    } else if (windSheer < 0 && shouldBias) {
      startX = 100 + Math.random() * buffer * 1.6; // enter from right
    }
    const endX = startX + drift;
    flake.style.setProperty("--size", `${isBranch ? branchSize : size}px`);
    flake.style.setProperty("--thickness", `${thickness}px`);
    flake.style.setProperty("--duration", `${duration}s`);
    flake.style.setProperty("--delay", `${delay}s`);
    flake.style.setProperty("--start-x", `${startX}vw`);
    flake.style.setProperty("--end-x", `${endX}vw`);
    flake.style.left = `${startX}vw`;
    snowLayer.appendChild(flake);
  }
};

const applySnowSettings = (event) => {
  event.preventDefault();
  const newSettings = normalizeSnowSettings({
    minSize: snowMinInput.value,
    maxSize: snowMaxInput.value,
    fallSpeed: snowSpeedInput.value,
    snowDensity: snowDensityInput.value,
    windSheer: snowWindInput.value,
    pointThreshold: snowPointThresholdInput.value,
  });
  snowSettings = newSettings;
  saveSnowSettings(newSettings);
  spawnSnow();
  closeSnowModal();
};

const init = async () => {
  await loadVideoContent();
  buildDays();
  renderCalendar();
  updateSubtitle();
  setSnowFormValues(snowSettings);
  spawnSnow();
};

init();

snowSettingsBtn?.addEventListener("click", openSnowModal);
snowClose?.addEventListener("click", closeSnowModal);
snowCancel?.addEventListener("click", closeSnowModal);
snowModalBackdrop?.addEventListener("click", closeSnowModal);
snowSettingsForm?.addEventListener("submit", applySnowSettings);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && snowModal && !snowModal.classList.contains("hidden")) {
    closeSnowModal();
  }
});
