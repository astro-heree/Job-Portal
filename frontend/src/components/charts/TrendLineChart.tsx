import type { ApplicationsTrendPoint } from "../../types";

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 24;

export function TrendLineChart({ data }: { data: ApplicationsTrendPoint[] }) {
  if (data.length === 0) return null;

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const stepX = (WIDTH - PADDING * 2) / Math.max(1, data.length - 1);

  const points = data.map((point, index) => {
    const x = PADDING + index * stepX;
    const y = HEIGHT - PADDING - (point.count / maxCount) * (HEIGHT - PADDING * 2);
    return { x, y, point };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT - PADDING} L${points[0].x},${
    HEIGHT - PADDING
  } Z`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Applications trend">
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      <path d={areaPath} fill="#dbeafe" opacity={0.6} />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={2} />
      {points.map(({ x, y, point }) => (
        <circle key={point.date} cx={x} cy={y} r={3} fill="#2563eb">
          <title>
            {point.date}: {point.count}
          </title>
        </circle>
      ))}
    </svg>
  );
}
