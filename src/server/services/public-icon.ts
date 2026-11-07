type DetailIcon = { isPremium: boolean; svg: string; publicId: string };

// Public API ke liye icon: internal publicId nahi, aur premium ka svg nahi.
export function toPublicIcon<T extends DetailIcon>(
  icon: T,
): Omit<T, "svg" | "publicId"> & { svg: string | null } {
  const { publicId, svg, ...rest } = icon;
  void publicId; // internal field, kabhi bahar nahi jata
  return { ...rest, svg: icon.isPremium ? null : svg };
}