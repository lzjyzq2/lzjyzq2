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
const MUTED = "#6F6A5E";
const PAPER = "#F4EFE6";

const ROW_H = 46;
const ICON_SIZE = 30;
const BAR_X = 250;      // where the bar chart starts
const BAR_MAX = 320;    // max bar width in px
const NAME_W = 150;     // width reserved for name col
const START_Y = 70;
const W = 760;
const H = START_Y + langs.length * ROW_H + 20;

function bar(percent, color){
  const filled = Math.round((percent / 100) * BAR_MAX);
  const empty = BAR_MAX - filled;
  // use rects for crisp bars (character-art feel via block look)
  return `<rect x="${BAR_X}" y="0" width="${filled}" height="16" rx="3" fill="${color}"/>` +
         `<rect x="${BAR_X+filled}" y="0" width="${empty}" height="16" rx="3" fill="#E7E2D6" opacity="0.6"/>`;
}

let rows = "";
langs.forEach((lang, i) => {
  const [name, skill, color, pct] = langs[i];
  const y = START_Y + i * ROW_H;
  const icon = icons[name] || "";
  // dark rounded badge behind icon so white glyphs are visible on light paper
  const iconBg = `<rect x="0" y="${y - ICON_SIZE + 4}" width="${ICON_SIZE}" height="${ICON_SIZE}" rx="6" fill="${INK}"/>`;
  const iconGroup = `<g transform="translate(0,${y - ICON_SIZE + 4}) scale(${ICON_SIZE/256})">${icon}</g>`;
  const nameText = `<text x="46" y="${y+6}" font-family="Georgia,'Times New Roman',serif" font-size="20" font-weight="600" fill="${INK}">${name}</text>`;
  const barGroup = '<g transform="translate(0,' + (y - 10) + ')">' + bar(pct, color) + '</g>';
  const pctText = `<text x="${BAR_X + BAR_MAX + 12}" y="${y+6}" font-family="'SFMono-Regular','JetBrains Mono',monospace" font-size="16" font-weight="700" fill="${color}">${pct}%</text>`;
  rows += iconBg + iconGroup + nameText + barGroup + pctText;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tech stack / 技术栈">
  <rect width="${W}" height="${H}" fill="${PAPER}" rx="8"/>
  <text x="0" y="40" font-family="Georgia,'Times New Roman',serif" font-size="24" font-weight="700" fill="${INK}">The Stack</text>
  <text x="92" y="40" font-family="Georgia,'Times New Roman',serif" font-size="24" font-weight="400" fill="${MUTED}">· 技术栈</text>
  ${rows}
</svg>`;

fs.writeFileSync("stack.svg", svg);
console.log("wrote stack.svg", svg.length, "bytes");
