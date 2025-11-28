export const updateSubtitle = (subtitleEl, days, openedDays) => {
  if (!subtitleEl) return;
  const now = new Date();
  const decFirst = new Date(now.getFullYear(), 11, 1);
  const beforeDecember = now < decFirst;

  if (beforeDecember) {
    const diffDays = Math.max(
      1,
      Math.ceil((decFirst.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    subtitleEl.textContent =
      diffDays === 1 ? "1 day until December 1st!" : `${diffDays} days until December 1st!`;
    subtitleEl.classList.remove("subtitle--loading");
    return;
  }

  const available = days.filter((day) => day.unlocked && !openedDays.has(day.day)).length;
  if (available === 0) {
    subtitleEl.textContent = "Revisit some of your favorites!";
  } else if (available === 1) {
    subtitleEl.textContent = "Open the window to reveal today's cheer!";
  } else {
    subtitleEl.textContent = "Open a window to reveal some cheer!";
  }
  subtitleEl.classList.remove("subtitle--loading");
};
