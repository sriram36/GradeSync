export function TeacherIllustration({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="var(--color-purple-soft)" />
      <circle cx="32" cy="25" r="11" fill="#3a3a3f" />
      <path
        d="M13 58c0-11 8.5-19 19-19s19 8 19 19"
        fill="#ff6b4a"
      />
      <rect x="24" y="43" width="16" height="12" rx="3" fill="white" />
      <rect x="27" y="46" width="10" height="1.6" rx="0.8" fill="var(--color-purple)" />
      <rect x="27" y="49.5" width="7" height="1.6" rx="0.8" fill="var(--color-purple)" />
    </svg>
  );
}
