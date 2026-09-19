const sleeperPositions = Array.from({ length: 31 }, (_, i) => i * 40);

export function RailDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full overflow-hidden text-[#c8901f] ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 20"
        preserveAspectRatio="none"
        className="block h-3.5 w-full"
      >
        <line
          x1="0"
          y1="6"
          x2="1200"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="0"
          y1="14"
          x2="1200"
          y2="14"
          stroke="currentColor"
          strokeWidth="2"
        />
        {sleeperPositions.map((x) => (
          <line
            key={x}
            x1={x}
            y1="2"
            x2={x}
            y2="18"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.55"
          />
        ))}
      </svg>
    </div>
  );
}
