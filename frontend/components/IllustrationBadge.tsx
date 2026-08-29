import { TeacherIllustration } from "./TeacherIllustration";

export function IllustrationBadge() {
  const dots = [
    { top: "2%", left: "50%", size: 10 },
    { top: "18%", left: "88%", size: 7 },
    { top: "50%", left: "97%", size: 9 },
    { top: "82%", left: "85%", size: 6 },
    { top: "92%", left: "50%", size: 8 },
    { top: "78%", left: "10%", size: 6 },
    { top: "48%", left: "0%", size: 9 },
    { top: "15%", left: "12%", size: 7 },
  ];

  return (
    <div className="relative h-24 w-24">
      <div className="absolute inset-0 rounded-full bg-[var(--color-accent-soft)]" />
      <div className="absolute inset-[10%] overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
        <TeacherIllustration size={80} />
      </div>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--color-accent)]"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
