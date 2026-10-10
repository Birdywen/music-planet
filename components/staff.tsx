"use client";

const LINES = [40, 52, 64, 76, 88];

const PC_TO_DIA = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

function diatonicIndex(midi: number): number {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return octave * 7 + PC_TO_DIA[pc];
}

const E4_INDEX = 4 * 7 + 2;

function yForMidi(midi: number): number {
  return 88 - (diatonicIndex(midi) - E4_INDEX) * 6;
}

interface StaffProps {
  midis: number[];
  width?: number;
  color?: string;
}

/** Treble staff that renders one or more notes. */
export function Staff({ midis, width = 300, color = "var(--grape)" }: StaffProps) {
  const height = 140;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="五线谱">
      <rect x={0} y={0} width={width} height={height} rx={16} fill="#fff" />
      {LINES.map((y) => (
        <line key={y} x1={16} y1={y} x2={width - 16} y2={y} stroke="#1b2a4a" strokeWidth={2} opacity={0.75} />
      ))}
      <text x={22} y={92} fontSize={78} fontFamily="serif" fill="#1b2a4a">
        {"𝄞"}
      </text>

      {midis.map((m, i) => {
        const x = 140 + i * 60;
        const y = yForMidi(m);
        const isBlack = [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
        const stemUp = y > 64;
        return (
          <g key={`${m}-${i}`}>
            {y >= 94 && <line x1={x - 16} y1={100} x2={x + 16} y2={100} stroke="#1b2a4a" strokeWidth={2} />}
            {y <= 34 && <line x1={x - 16} y1={28} x2={x + 16} y2={28} stroke="#1b2a4a" strokeWidth={2} />}
            {isBlack && (
              <text x={x - 30} y={y + 7} fontSize={26} fontFamily="serif" fill={color} fontWeight={700}>
                ♯
              </text>
            )}
            <ellipse cx={x} cy={y} rx={9} ry={6.6} fill={color} transform={`rotate(-18 ${x} ${y})`} />
            <line
              x1={stemUp ? x + 8.5 : x - 8.5}
              y1={y}
              x2={stemUp ? x + 8.5 : x - 8.5}
              y2={stemUp ? y - 44 : y + 44}
              stroke={color}
              strokeWidth={3}
            />
          </g>
        );
      })}
    </svg>
  );
}
