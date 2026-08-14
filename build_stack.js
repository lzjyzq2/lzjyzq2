// build_stack.js — regenerate stack.svg from your live public-repo language data.
// Usage: node build_stack.js   (requires gh CLI authenticated, or set GITHUB_TOKEN + use curl)
const { execSync } = require("child_process");
const fs = require("fs");

const OWNER = process.env.OWNER || "lzjyzq2";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || "";
const CURL_PROXY = PROXY ? `-x "${PROXY}"` : "";

// GitHub language name -> skillicons id
const ICON_MAP = {
  Java: "java", JavaScript: "js", TypeScript: "ts", Python: "python",
  Go: "go", Rust: "rust", "C++": "cpp", C: "c", "C#": "cs",
  PHP: "php", Ruby: "ruby", Swift: "swift", Kotlin: "kotlin",
  Dart: "dart", Vue: "vuejs", HTML: "html", CSS: "css",
  Shell: "bash", Lua: "lua", Scala: "scala", "Objective-C": "objectivec",
};

function ghApi(path) {
  // prefer gh CLI; falls back to curl with token
  try {
    return execSync(`gh api "${path}"`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch (e) {
    const auth = GITHUB_TOKEN ? `-H "Authorization: token ${GITHUB_TOKEN}"` : "";
    return execSync(`curl -sS ${auth} "https://api.github.com${path}"`).toString();
  }
}

// 1. aggregate language bytes across non-fork public repos
console.log("fetching repos...");
const repos = JSON.parse(ghApi(`/users/${OWNER}/repos?per_page=100&type=public`))
  .filter(r => !r.fork)
  .map(r => r.name);
console.log("non-fork repos:", repos.length);

const langBytes = {};
for (const name of repos) {
  try {
    const data = JSON.parse(ghApi(`/repos/${OWNER}/${name}/languages`));
    for (const [lang, bytes] of Object.entries(data)) {
      langBytes[lang] = (langBytes[lang] || 0) + bytes;
    }
  } catch (e) { /* skip */ }
}
const total = Object.values(langBytes).reduce((a, b) => a + b, 0);
const sorted = Object.entries(langBytes).sort((a, b) => b[1] - a[1]);
console.log("total bytes:", total);

// take top 8 languages
const langs = sorted.slice(0, 8).map(([name, bytes]) => {
  const pct = parseFloat(((bytes / total) * 100).toFixed(1));
  return { name, pct, icon: ICON_MAP[name] || null };
});

// 2. fetch skillicons (only for languages that have a mapping)
const icons = {};
for (const l of langs) {
  if (!l.icon) { console.log(l.name, "-> no icon, skipped"); continue; }
  try {
    const svg = execSync(`curl ${CURL_PROXY} -sS --max-time 20 "https://skillicons.dev/icons?i=${l.icon}"`).toString();
    const paths = svg.match(/<path[^>]*\/>/g) || [];
    icons[l.name] = paths.join("");
    console.log(l.name, "-> icon paths:", paths.length);
  } catch (e) { console.log(l.name, "-> icon fetch failed"); }
}
fs.writeFileSync("/tmp/icons.json", JSON.stringify(icons));

// 3. build SVG (magazine style, straight corners, rounded icon badges)
const INK = "#16140F";
const PAPER = "#F4EFE6";

const ROW_H = 44;
const BAR_H = 14;
const ICON_SIZE = 26;
const ICON_GAP = 14;
const NAME_W = 130;
const BAR_MAX = 300;
const PAD_X = 24;
const PAD_Y = 20;

const BAR_X = PAD_X + ICON_SIZE + ICON_GAP + NAME_W + 56;
const PCT_X = BAR_X + BAR_MAX + 16;
const W = PCT_X + 70;
const H = PAD_Y * 2 + langs.length * ROW_H;

function barColor(pct) {
  // map pct to a warm magazine scale; fallback to ink for tiny values
  return INK;
}
function langColor(name) {
  const palette = {
    Java: "#b07219", JavaScript: "#f1e05a", TypeScript: "#3178c6",
    Python: "#3572A5", Go: "#00ADD8", Rust: "#dea584", "C++": "#f34b7d",
    C: "#555555", "C#": "#178600", PHP: "#4F5D95", Ruby: "#CC342D",
    Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#0175C2", Vue: "#41b883",
    HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Lua: "#000080",
    Scala: "#c22d40",
  };
  return palette[name] || INK;
}

function bar(percent, color) {
  const filled = Math.round((percent / 100) * BAR_MAX);
  const empty = BAR_MAX - filled;
  return `<rect x="${BAR_X}" y="0" width="${filled}" height="${BAR_H}" fill="${color}"/>` +
         `<rect x="${BAR_X + filled}" y="0" width="${empty}" height="${BAR_H}" fill="#E4DFD2"/>`;
}

let rows = "";
langs.forEach((l, i) => {
  const cy = PAD_Y + i * ROW_H + ROW_H / 2;
  const color = langColor(l.name);
  const iconTop = cy - ICON_SIZE / 2;

  let iconBg = "", iconGroup = "";
  if (icons[l.name]) {
    iconBg = `<rect x="${PAD_X}" y="${iconTop}" width="${ICON_SIZE}" height="${ICON_SIZE}" rx="5" fill="${INK}"/>`;
    iconGroup = `<g transform="translate(${PAD_X},${iconTop}) scale(${ICON_SIZE / 256})">${icons[l.name]}</g>`;
  }
  const nameX = PAD_X + ICON_SIZE + ICON_GAP + NAME_W;
  const nameText = `<text x="${nameX}" y="${cy}" font-family="Georgia,'Times New Roman',serif" font-size="18" font-weight="600" fill="${INK}" text-anchor="end" dominant-baseline="central">${l.name}</text>`;
  const barTop = cy - BAR_H / 2;
  const barGroup = '<g transform="translate(0,' + barTop + ')">' + bar(l.pct, color) + '</g>';
  const pctText = `<text x="${PCT_X}" y="${cy}" font-family="'SFMono-Regular','JetBrains Mono',monospace" font-size="15" font-weight="700" fill="${color}" dominant-baseline="central">${l.pct}%</text>`;
  rows += iconBg + iconGroup + nameText + barGroup + pctText;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tech stack / 技术栈">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${rows}
</svg>`;

fs.writeFileSync("stack.svg", svg);
console.log("wrote stack.svg", svg.length, "bytes", W + "x" + H);
