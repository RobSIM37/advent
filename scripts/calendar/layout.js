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

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

const createWindow = (day, size, openedDays, onOpenDay, onOpenedChange) => {
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
    button.classList.remove("window--ready");
    button.classList.add("window--opened");
    pill.textContent = "Opened";
    onOpenedChange?.(openedDays);
  };

  if (day.unlocked) {
    button.addEventListener("click", () => {
      onOpenDay?.(day, button);
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

export const renderCalendar = ({ gridEl, days, openedDays, onOpenDay, onOpenedChange }) => {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  placements.length = 0;
  const { sizes, targetRows } = buildWindowSizes(days.length);
  let plan = null;
  let windowSizes = [];

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

  shuffle([...days]).forEach((day, index) => {
    gridEl.appendChild(createWindow(day, windowSizes[index], openedDays, onOpenDay, onOpenedChange));
  });
  applyRowOffsets();
};
