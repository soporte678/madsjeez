import fs from "fs";

const t = fs.readFileSync("src/components/CategoryIcon.tsx", "utf8");
const m = t.match(/const ICONS[^=]+=\s*\{([^}]+)\}/s);
const names = [...m[1].matchAll(/^\s+([A-Z][A-Za-z0-9]+),/gm)].map((x) => x[1]);
if (!names.includes("MoreHorizontal")) names.push("MoreHorizontal");
names.sort();

const lines = names.map((n) => `  "${n}",`).join("\n");
const out = `// Icon names available in CategoryIcon — keep in sync with CategoryIcon.tsx
export const CATEGORY_ICON_NAMES = [
${lines}
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const CATEGORY_ICON_SET = new Set<string>(CATEGORY_ICON_NAMES);
`;

fs.writeFileSync("src/lib/category-icon-names.ts", out);
console.log("wrote", names.length, "names");
