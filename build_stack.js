const fs = require("fs");
const icons = JSON.parse(fs.readFileSync("/tmp/icons.json","utf8"));

const langs = [
  ["Java",        "java",      "#b07219", 63.4],
  ["Vue",         "vuejs",     "#41b883", 15.2],
  ["TypeScript",  "ts",        "#3178c6", 10.0],
  ["JavaScript",  "js",        "#f1e05a",  7.3],
  ["CSS",         "css",       "#563d7c",  1.3],
  ["HTML",        "html",      "#e34c26",  1.3],
  ["Rust",        "rust",      "#dea584",  0.6],
];

// magazine palette
const INK = "#16140F";
const PAPER = "#F4EFE6";

const ROW_H = 44;
const BAR_H = 14;
const ICON_SIZE = 26;
const ICON_GAP = 14;       // space between icon and name
const NAME_GAP = 56;       // space between name and bar
const NAME_W = 130;        // name column width (right-aligned)
const BAR_MAX = 300;       // max bar width in px
const PAD_X = 24;          // left/right padding
const PAD_Y = 20;          // top/bottom padding

const BAR_X = PAD_X + ICON_SIZE + ICON_GAP + NAME_W + NAME_GAP;
const PCT_X = BAR_X + BAR_MAX + 16;
const W = PCT_X + 70;
const H = PAD_Y * 2 + langs.length * ROW_H;

function bar(percent, color){
  const filled = Math.round((percent / 100) * BAR_MAX);
  const empty = BAR_MAX - filled;
  return `<rect x="${BAR_X}" y="0" width="${filled}" height="${BAR_H}" fill="${color}"/>` +
         `<rect x="${BAR_X+filled}" y="0" width="${empty}" height="${BAR_H}" fill="#E4DFD2"/>`;
}

let rows = "";
langs.forEach((lang, i) => {
  const [name, skill, color, pct] = langs[i];
  const cy = PAD_Y + i * ROW_H + ROW_H / 2;   // vertical center of the row
  const icon = icons[name] || "";

  // icon badge (sharp corners), vertically centered
  const iconTop = cy - ICON_SIZE / 2;
  const iconBg = `<rect x="${PAD_X}" y="${iconTop}" width="${ICON_SIZE}" height="${ICON_SIZE}" rx="5" fill="${INK}"/>`;
  const iconGroup = `<g transform="translate(${PAD_X},${iconTop}) scale(${ICON_SIZE/256})">${icon}</g>`;

  // name (right-aligned, vertically centered via dominant-baseline)
  const nameX = PAD_X + ICON_SIZE + ICON_GAP + NAME_W;
  const nameText = `<text x="${nameX}" y="${cy}" font-family="Georgia,'Times New Roman',serif" font-size="18" font-weight="600" fill="${INK}" text-anchor="end" dominant-baseline="central">${name}</text>`;

  // bar, vertically centered
  const barTop = cy - BAR_H / 2;
  const barGroup = '<g transform="translate(0,' + barTop + ')">' + bar(pct, color) + '</g>';

  // percentage (left-aligned, vertically centered)
  const pctText = `<text x="${PCT_X}" y="${cy}" font-family="'SFMono-Regular','JetBrains Mono',monospace" font-size="15" font-weight="700" fill="${color}" dominant-baseline="central">${pct}%</text>`;

  rows += iconBg + iconGroup + nameText + barGroup + pctText;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tech stack / 技术栈">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${rows}
</svg>`;

fs.writeFileSync("stack.svg", svg);
console.log("wrote stack.svg", svg.length, "bytes", "dims", W + "x" + H);
