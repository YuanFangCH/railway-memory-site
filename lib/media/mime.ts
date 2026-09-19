const mimeByExtension: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

export function mimeFromKey(key: string) {
  const extension = key.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  return mimeByExtension[extension] || "application/octet-stream";
}
