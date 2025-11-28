import { clamp } from "../utils/math.js";

export const spawnSnow = (snowLayer, snowSettings) => {
  if (!snowLayer || !snowSettings) return;
  const { minSize, maxSize, fallSpeed, snowDensity, windSheer, pointThreshold } = snowSettings;
  const flakeCount = Math.round(snowDensity);
  const EASTER_EGG_CHANCE = 0.001;
  const computeDelayWindow = (count, speed) => {
    const speedWindow = Math.max(8, speed * 2.2);
    const densityBoost = Math.max(0, (220 / Math.max(count, 1) - 1) * 3);
    return Math.min(70, speedWindow + densityBoost);
  };
  const delayWindow = computeDelayWindow(flakeCount, fallSpeed);
  snowLayer.innerHTML = "";
  for (let i = 0; i < flakeCount; i += 1) {
    const flake = document.createElement("span");
    const isEasterEgg = Math.random() < EASTER_EGG_CHANCE;
    const baseSize = minSize + Math.random() * (maxSize - minSize);
    const size = isEasterEgg ? maxSize : baseSize;
    const isBranch = size >= pointThreshold && !isEasterEgg;
    const shapes = ["candy-cane", "tree", "heart", "snowman"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    flake.className = isBranch ? "snowflake snowflake--branch" : "snowflake";
    if (isEasterEgg) {
      flake.classList.add("snowflake--easter", `snowflake--${shape}`);
    }
    const branchSize = clamp(size + 4, minSize, maxSize + 6);
    const thickness = clamp(size * 0.22, 2, 8);
    const baseDuration = Math.max(2, fallSpeed + (Math.random() * 4 - 2));
    const duration = isEasterEgg ? baseDuration * 1.6 : baseDuration;
    const spacing = delayWindow / Math.max(flakeCount, 1);
    const jitter = Math.max(spacing * 0.6, 0.6);
    const delay = spacing * i + Math.random() * jitter;
    const driftBase = Math.random() * 24 - 12 + windSheer;
    const windFactor = Math.min(1, Math.abs(windSheer) / 80);
    const drift = isEasterEgg ? driftBase * 0.35 : driftBase;
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
