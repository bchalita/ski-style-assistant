/** Map a product color name to a CSS background for the swatch dot */
const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  red: "#c0392b",
  blue: "#2980b9",
  navy: "#1a2744",
  green: "#27ae60",
  orange: "#e67e22",
  gray: "#7f8c8d",
  grey: "#7f8c8d",
  beige: "#d4c5a9",
  brown: "#6d4c2e",
  yellow: "#f1c40f",
  pink: "#e84393",
  purple: "#8e44ad",
  "dark gray": "#4a4a4a",
  "off white": "#faf0e6",
  "slate blue": "#5b7ba3",
  "storm": "#6c7a89",
  "dynasty": "#8b2252",
  "mars": "#b03a2e",
  "black sapphire": "#0d1b2a",
  "solitude void": "#2c3e50",
  "vitality": "#27ae60",
  "copper sky canvas": "#b87333",
  "forage canvas": "#6b7c3f",
  "flash orange": "#ff6600",
  "spyder red": "#cc0000",
  "woodland green": "#2d5a27",
  "summit navy": "#1a2744",
  "sumac": "#8b4513",
  "dusk blue": "#3d5a80",
  "toasted brown": "#8b6914",
  "mushroom grey": "#9e9e8e",
  "north star white": "#f8f6f0",
  "granite grey": "#808080",
  "summit taupe": "#b8a99a",
  "gray cloud": "#b0b0b0",
  "gray heather": "#a0a0a0",
  "jake blue": "#4682b4",
  "very berry": "#8b0045",
  "true black": "#0a0a0a",
};

export function colorToCss(colorName: string): string {
  const key = colorName.toLowerCase().trim();
  return COLOR_MAP[key] ?? "#9ca3af";
}

export function needsBorder(colorName: string): boolean {
  const light = ["white", "off white", "north star white", "gray cloud"];
  return light.includes(colorName.toLowerCase().trim());
}
