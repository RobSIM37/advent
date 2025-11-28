const clearPlayer = (heroPlayer) => {
  if (heroPlayer) heroPlayer.innerHTML = "";
};

const animateHeroIn = (heroEl, heroCard, heroBackdrop, origin) => {
  if (!heroEl || !heroCard || !heroBackdrop || !origin) return;
  heroEl.classList.remove("hidden");
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

const animateHeroOut = (heroEl, heroCard, heroBackdrop, heroPlayer) => {
  if (!heroEl || !heroCard || !heroBackdrop) return;
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
    heroEl.classList.add("hidden");
    clearPlayer(heroPlayer);
    heroCard.removeEventListener("transitionend", cleanup);
  };

  heroCard.addEventListener("transitionend", cleanup);
};

export const createHero = ({
  heroEl,
  heroCard,
  heroBackdrop,
  heroDay,
  heroTitle,
  heroMessage,
  heroPlayer,
  closeButton,
}) => {
  const openHero = (day, origin) => {
    if (!heroEl) return;
    if (heroDay) heroDay.textContent = `Day ${day.day}`;
    if (heroTitle) heroTitle.textContent = day.title;
    if (heroMessage) heroMessage.textContent = day.message || "";
    clearPlayer(heroPlayer);

    if (heroPlayer) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${day.videoId}?autoplay=1&rel=0`;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      heroPlayer.appendChild(iframe);
    }

    animateHeroIn(heroEl, heroCard, heroBackdrop, origin);
  };

  const closeHero = () => {
    animateHeroOut(heroEl, heroCard, heroBackdrop, heroPlayer);
  };

  closeButton?.addEventListener("click", closeHero);
  heroEl?.addEventListener("click", (event) => {
    const target = event.target;
    if (target === heroEl || target?.classList.contains("hero__backdrop")) {
      closeHero();
    }
  });

  return { openHero, closeHero };
};
