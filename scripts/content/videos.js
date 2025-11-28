export const defaultVideoPool = [
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

export const resolveVideoPool = async () => {
  try {
    const response = await fetch("content/content.json", { cache: "no-cache" });
    if (!response.ok) return [...defaultVideoPool];
    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      return data;
    }
    return [...defaultVideoPool];
  } catch (error) {
    console.warn("Falling back to default videos; unable to load content.json", error);
    return [...defaultVideoPool];
  }
};
