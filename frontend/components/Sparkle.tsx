export function Sparkle({ className = "", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2c.4 3.6 1.2 5.9 2.5 7.2 1.3 1.3 3.6 2.1 7.2 2.5-3.6.4-5.9 1.2-7.2 2.5-1.3 1.3-2.1 3.6-2.5 7.2-.4-3.6-1.2-5.9-2.5-7.2-1.3-1.3-3.6-2.1-7.2-2.5 3.6-.4 5.9-1.2 7.2-2.5C10.8 7.9 11.6 5.6 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
