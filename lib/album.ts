type AlbumImageRow = {
  id?: string;
  asset?: {
    thumbnailUrl?: string | null;
    publicUrl?: string | null;
  } | null;
};

export function pickAlbumCover(rows: AlbumImageRow[]): string | null {
  const ranked = [...rows].sort((a, b) =>
    String(a.id ?? "").localeCompare(String(b.id ?? ""))
  );

  for (const row of ranked) {
    const src = row.asset?.thumbnailUrl ?? row.asset?.publicUrl;
    if (src) {
      return src;
    }
  }

  return null;
}
