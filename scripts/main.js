import { buildDays } from "./calendar/days.js";
import { renderCalendar } from "./calendar/layout.js";
import { resolveVideoPool } from "./content/videos.js";
import { createHero } from "./hero/hero.js";
import { spawnSnow } from "./snow/render.js";
import { createSnowSettingsController } from "./snow/settings.js";
import {
  defaultSnowSettings,
  loadOpened,
  loadSnowSettings,
  saveOpened,
  saveSnowSettings,
} from "./state/storage.js";
import { updateSubtitle } from "./ui/subtitle.js";

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

const openedDays = loadOpened();
let snowSettings = loadSnowSettings();
let days = [];

const heroController = createHero({
  heroEl: hero,
  heroCard,
  heroBackdrop,
  heroDay,
  heroTitle,
  heroMessage,
  heroPlayer,
  closeButton: heroClose,
});

const refreshSubtitle = () => updateSubtitle(subtitle, days, openedDays);

const onOpenedChange = () => {
  saveOpened(openedDays);
  refreshSubtitle();
};

const snowSettingsController = createSnowSettingsController({
  modal: snowModal,
  modalBackdrop: snowModalBackdrop,
  form: snowSettingsForm,
  openButton: snowSettingsBtn,
  closeButton: snowClose,
  cancelButton: snowCancel,
  inputs: {
    minSize: snowMinInput,
    maxSize: snowMaxInput,
    fallSpeed: snowSpeedInput,
    snowDensity: snowDensityInput,
    windSheer: snowWindInput,
    pointThreshold: snowPointThresholdInput,
  },
  onApply: (newSettings) => {
    snowSettings = newSettings;
    saveSnowSettings(newSettings);
    spawnSnow(snowLayer, snowSettings);
  },
  initialSettings: snowSettings || { ...defaultSnowSettings },
});

const init = async () => {
  const videoPool = await resolveVideoPool();
  days = buildDays(videoPool);
  renderCalendar({
    gridEl: calendarGrid,
    days,
    openedDays,
    onOpenDay: heroController.openHero,
    onOpenedChange,
  });
  refreshSubtitle();
  snowSettingsController.setSettings(snowSettings);
  spawnSnow(snowLayer, snowSettings);
};

init();
