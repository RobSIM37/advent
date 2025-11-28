import { clamp } from "../utils/math.js";

export const STORAGE_KEY = "advent-opened-days";
export const SNOW_SETTINGS_KEY = "advent-snow-settings";

export const defaultSnowSettings = {
  minSize: 2,
  maxSize: 14,
  fallSpeed: 9,
  snowDensity: 140,
  windSheer: 0,
  pointThreshold: 12,
};

export const normalizeSnowSettings = (settings) => {
  const minSize = clamp(Number(settings.minSize) || defaultSnowSettings.minSize, 1, 60);
  const maxSize = clamp(Number(settings.maxSize) || defaultSnowSettings.maxSize, minSize + 1, 80);
  const fallSpeed = clamp(Number(settings.fallSpeed) || defaultSnowSettings.fallSpeed, 2, 20);
  const snowDensity = clamp(
    Number(settings.snowDensity) || defaultSnowSettings.snowDensity,
    20,
    400
  );
  const windSheer = clamp(Number(settings.windSheer) || defaultSnowSettings.windSheer, -120, 120);
  const pointThreshold = clamp(
    Number(settings.pointThreshold) || defaultSnowSettings.pointThreshold,
    minSize,
    maxSize
  );
  return { minSize, maxSize, fallSpeed, snowDensity, windSheer, pointThreshold };
};

export const loadOpened = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Unable to read opened days; starting fresh.", error);
    return new Set();
  }
};

export const saveOpened = (openedSet) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openedSet)));
  } catch (error) {
    console.warn("Unable to persist opened days.", error);
  }
};

export const loadSnowSettings = () => {
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

export const saveSnowSettings = (settings) => {
  try {
    localStorage.setItem(SNOW_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Unable to save snow settings.", error);
  }
};
