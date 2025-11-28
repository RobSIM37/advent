const isUnlocked = (dayNumber) => {
  const now = new Date();
  const isDecember = now.getMonth() === 11; // 0-indexed months
  if (!isDecember) return false;
  return dayNumber <= now.getDate();
};

export const buildDays = (videoPool) =>
  Array.from({ length: 25 }, (_, index) => {
    const dayNumber = index + 1;
    const videoId = videoPool[(dayNumber - 1) % videoPool.length];
    return {
      day: dayNumber,
      unlocked: isUnlocked(dayNumber),
      title: `Window ${dayNumber}`,
      message: videoId,
      videoId,
    };
  });
