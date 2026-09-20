type GlyphProps = { className?: string };

/** Google Photos mark: four-colour pinwheel (red top, blue right, green bottom, yellow left). */
export function GooglePhotosIcon({ className }: GlyphProps) {
  const blade = "M24 24V4a20 20 0 0 1 20 20 10 10 0 0 0-20 0Z";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path d={blade} fill="#EA4335" transform="rotate(-45 24 24)" />
      <path d={blade} fill="#4285F4" transform="rotate(45 24 24)" />
      <path d={blade} fill="#34A853" transform="rotate(135 24 24)" />
      <path d={blade} fill="#FBBC05" transform="rotate(225 24 24)" />
    </svg>
  );
}

/** Photo gallery: a stack of pictures, the front one showing a landscape. */
export function GalleryIcon({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="wynGalleryClip">
          <rect x="6" y="13" width="36" height="26" rx="5" />
        </clipPath>
      </defs>
      <rect
        x="9"
        y="7"
        width="30"
        height="22"
        rx="4"
        transform="rotate(-9 24 18)"
        fill="#FFFFFF"
        opacity="0.18"
      />
      <rect x="6" y="13" width="36" height="26" rx="5" fill="#0B1220" />
      <g clipPath="url(#wynGalleryClip)">
        <rect x="6" y="13" width="36" height="26" fill="#38BDF8" />
        <circle cx="34" cy="21" r="4" fill="#FDB92D" />
        <path d="M6 39 19 24l9 11 6-7 8 11Z" fill="#34A853" />
        <path d="M6 39 15 28l9 11Z" fill="#1E8E3E" />
      </g>
      <rect x="6" y="13" width="36" height="26" rx="5" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" />
    </svg>
  );
}

/** Files: a blue folder with a sheet inside. */
export function FolderIcon({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wynFolderFront" x1="6" y1="19" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5C9CFF" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
      </defs>
      <path
        d="M6 13a4 4 0 0 1 4-4h9l4 5h15a4 4 0 0 1 4 4v3H6Z"
        fill="#1558B0"
      />
      <rect x="12" y="14" width="24" height="9" rx="2" fill="#FFFFFF" opacity="0.9" />
      <path
        d="M6 19h36a3 3 0 0 1 3 3.2l-2 16a4 4 0 0 1-4 3.8H9a4 4 0 0 1-4-4Z"
        fill="url(#wynFolderFront)"
      />
    </svg>
  );
}
