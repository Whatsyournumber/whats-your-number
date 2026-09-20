type GlyphProps = { className?: string };

/** Google "G" mark: the official four-colour glyph. */
export function GooglePhotosIcon({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
      />
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
