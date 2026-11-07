"use client";

const PRESETS: { name: string; value: string | undefined }[] = [
  { name: "Default", value: undefined },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Amber", value: "#f59e0b" },
];

type Props = {
  size: number;
  onSizeChange: (size: number) => void;
  color?: string;
  onColorChange: (color: string | undefined) => void;
};

export function PreviewControls({ size, onSizeChange, color, onColorChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-subtle">Size</span>
        <input
          type="range"
          aria-label="Size"
          min={16}
          max={160}
          step={4}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-40 accent-current"
        />
        <span className="w-12 tabular-nums text-subtle">{size}px</span>
      </div>

      <div role="group" aria-label="Color" className="flex items-center gap-1.5">
        <span className="mr-1 text-subtle">Color</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-label={p.name}
            aria-pressed={color === p.value}
            onClick={() => onColorChange(p.value)}
            style={p.value ? { backgroundColor: p.value } : undefined}
            className={`size-6 rounded-full border border-line ${
              p.value ? "" : "bg-ink"
            } aria-pressed:ring-2 aria-pressed:ring-ink/60 aria-pressed:ring-offset-2 aria-pressed:ring-offset-canvas`}
          />
        ))}
        <input
          type="color"
          aria-label="Custom color"
          value={color ?? "#000000"}
          onChange={(e) => onColorChange(e.target.value)}
          className="size-6 cursor-pointer rounded-full border border-line bg-transparent p-0"
        />
      </div>
    </div>
  );
}