import { colorToCss, needsBorder } from "@/utils/colorUtils";

interface Props {
  color: string;
  isActive: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

export default function ColorSwatch({ color, isActive, onClick, size = "md" }: Props) {
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const ring = isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "";
  const border = needsBorder(color) ? "border border-border" : "";

  return (
    <button
      type="button"
      title={color}
      onClick={onClick}
      className={`${dim} rounded-full ${ring} ${border} transition-all hover:scale-110 shrink-0`}
      style={{ backgroundColor: colorToCss(color) }}
    />
  );
}
