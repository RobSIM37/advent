import { defaultSnowSettings, normalizeSnowSettings } from "../state/storage.js";

const getInputNumber = (input, fallback) => {
  const parsed = Number(input?.value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatRangeText = (min, max, unit) => {
  const suffix = unit ? ` ${unit}` : "";
  return `${min} - ${max}${suffix}`;
};

export const createSnowSettingsController = ({
  modal,
  modalBackdrop,
  form,
  openButton,
  closeButton,
  cancelButton,
  inputs,
  onApply,
  initialSettings,
}) => {
  let currentSettings = initialSettings || { ...defaultSnowSettings };

  const snowFieldConfigs = [
    {
      key: "minSize",
      input: inputs?.minSize,
      unit: "px",
      getRange: () => ({ min: 1, max: 60 }),
    },
    {
      key: "maxSize",
      input: inputs?.maxSize,
      unit: "px",
      getRange: () => {
        const minSize = getInputNumber(inputs?.minSize, defaultSnowSettings.minSize);
        return { min: Math.max(2, minSize + 1), max: 80 };
      },
    },
    {
      key: "pointThreshold",
      input: inputs?.pointThreshold,
      unit: "px",
      getRange: () => {
        const minSize = getInputNumber(inputs?.minSize, defaultSnowSettings.minSize);
        const maxSize = getInputNumber(inputs?.maxSize, defaultSnowSettings.maxSize);
        const min = Math.max(1, minSize);
        const max = Math.max(min, maxSize);
        return { min, max };
      },
    },
    {
      key: "fallSpeed",
      input: inputs?.fallSpeed,
      unit: "seconds",
      getRange: () => ({ min: 2, max: 20 }),
    },
    {
      key: "snowDensity",
      input: inputs?.snowDensity,
      unit: "flakes",
      getRange: () => ({ min: 20, max: 400 }),
    },
    {
      key: "windSheer",
      input: inputs?.windSheer,
      unit: "",
      getRange: () => ({ min: -120, max: 120 }),
    },
  ];

  const setSnowFormValues = (settings) => {
    if (!inputs) return;
    if (inputs.minSize) inputs.minSize.value = settings.minSize;
    if (inputs.maxSize) inputs.maxSize.value = settings.maxSize;
    if (inputs.fallSpeed) inputs.fallSpeed.value = settings.fallSpeed;
    if (inputs.snowDensity) inputs.snowDensity.value = settings.snowDensity;
    if (inputs.windSheer) inputs.windSheer.value = settings.windSheer;
    if (inputs.pointThreshold) inputs.pointThreshold.value = settings.pointThreshold;
  };

  const buildSnowFieldMessages = () => {
    snowFieldConfigs.forEach((config) => {
      if (!config.input) return;
      const field = config.input.closest(".modal__field");
      if (!field) return;
      const helper = document.createElement("div");
      helper.className = "modal__helper";
      helper.setAttribute("aria-live", "polite");
      const error = document.createElement("div");
      error.className = "modal__error";
      error.setAttribute("aria-live", "polite");
      field.append(helper, error);
      config.helper = helper;
      config.error = error;
    });
  };

  const setSnowFieldError = (config, message) => {
    if (!config.input) return;
    config.input.setCustomValidity(message || "");
    const field = config.input.closest(".modal__field");
    if (field) {
      field.classList.toggle("modal__field--invalid", Boolean(message));
    }
    if (config.error) {
      config.error.textContent = message || "";
    }
  };

  const showSnowRangeHint = (config) => {
    if (!config.helper) return;
    const { min, max } = config.getRange();
    config.helper.textContent = `Valid range: ${formatRangeText(min, max, config.unit)}`;
  };

  const refreshSnowRangeHints = () => {
    snowFieldConfigs.forEach((config) => {
      if (config.helper && config.helper.textContent) {
        showSnowRangeHint(config);
      }
    });
  };

  const validateSnowField = (config) => {
    if (!config.input) return true;
    const { min, max } = config.getRange();
    const value = Number(config.input.value);
    let error = "";
    if (!Number.isFinite(value)) {
      error = "Enter a number.";
    } else if (value < min || value > max) {
      const suffix = config.unit ? ` ${config.unit}` : "";
      error = `Must be between ${min} and ${max}${suffix}.`;
    }
    setSnowFieldError(config, error);
    return !error;
  };

  const validateSnowForm = () => {
    let firstInvalid = null;
    const allValid = snowFieldConfigs.reduce((allGood, config) => {
      const valid = validateSnowField(config);
      if (!valid && !firstInvalid) firstInvalid = config;
      return allGood && valid;
    }, true);
    if (firstInvalid?.input) {
      firstInvalid.input.focus();
    }
    return allValid;
  };

  const resetSnowFieldErrors = () => {
    snowFieldConfigs.forEach((config) => setSnowFieldError(config, ""));
  };

  const open = () => {
    if (!modal) return;
    setSnowFormValues(currentSettings);
    resetSnowFieldErrors();
    refreshSnowRangeHints();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  };

  const close = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  const isOpen = () => modal && !modal.classList.contains("hidden");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateSnowForm()) return;
    const newSettings = normalizeSnowSettings({
      minSize: inputs?.minSize?.value,
      maxSize: inputs?.maxSize?.value,
      fallSpeed: inputs?.fallSpeed?.value,
      snowDensity: inputs?.snowDensity?.value,
      windSheer: inputs?.windSheer?.value,
      pointThreshold: inputs?.pointThreshold?.value,
    });
    currentSettings = newSettings;
    onApply?.(newSettings);
    close();
  };

  const wireEvents = () => {
    buildSnowFieldMessages();
    snowFieldConfigs.forEach((config) => {
      if (!config.input) return;
      config.input.addEventListener("focus", () => {
        showSnowRangeHint(config);
      });
      config.input.addEventListener("blur", () => {
        validateSnowField(config);
        refreshSnowRangeHints();
      });
      config.input.addEventListener("input", () => {
        if (config.input.validity.customError) {
          setSnowFieldError(config, "");
        }
        if (config.key === "minSize" || config.key === "maxSize") {
          refreshSnowRangeHints();
        }
      });
    });

    openButton?.addEventListener("click", open);
    closeButton?.addEventListener("click", close);
    cancelButton?.addEventListener("click", close);
    modalBackdrop?.addEventListener("click", close);
    form?.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        close();
      }
    });
  };

  wireEvents();

  return {
    open,
    close,
    setSettings: (settings) => {
      currentSettings = settings;
      setSnowFormValues(settings);
    },
  };
};
