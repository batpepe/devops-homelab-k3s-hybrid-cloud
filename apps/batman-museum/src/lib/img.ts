// Route remote artwork through our same-origin proxy: avoids hotlink referer
// quirks and gives WebGL textures a CORS-clean source.
export const imgSrc = (url: string | null): string =>
  url ? `/api/img?url=${encodeURIComponent(url)}` : "";
