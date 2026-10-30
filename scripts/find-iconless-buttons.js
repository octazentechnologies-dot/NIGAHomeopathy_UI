const fs = require("fs");
const path = require("path");

const roots = [
  "src/pages/Account",
  "src/pages/Admin",
  "src/pages/Doctor",
  "src/pages/Reception",
  "src/pages/Patient",
  "src/pages/Pharmacy",
  "src/pages/Support",
  "src/pages/Family",
  "src/pages/Notifications",
  "src/Components",
];

const skipDir = /node_modules|BaseUi|AdvanceUi|Charts|DashboardAnalytics|DashboardCrm|DashboardCrypto|DashboardJob|DashboardNFT|DashboardProject|Ecommerce|Icons|Maps|Tables|Forms|Widgets|Landing|Authentication|Pages\\|NFT|Jobs|FileManager|ToDo|Kanban|Crypto|Invoices|Email|Chat|Calendar|Projects|Tasks|CRM|APIKey/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (skipDir.test(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

const tagRe = /<(Button|button|Link)\b[\s\S]*?(?:<\/\1>|\/>)/g;

const hits = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\n/);
    let m;
    const re = /<(Button|button|Link)\b/g;
    while ((m = re.exec(text))) {
      const start = m.index;
      const slice = text.slice(start, start + 800);
      const close = slice.search(/<\/(Button|button|Link)>/);
      if (close < 0) continue;
      const block = slice.slice(0, close);
      const isBtn =
        /className=["'`][^"'`]*(^|\s)btn(\s|["'`])/.test(block) ||
        /className=\{`[^`]*\bbtn\b/.test(block) ||
        /<(Button)\b/.test(block.slice(0, 20));
      if (!isBtn) continue;
      if (/<i\b/.test(block) || /className=\{[^}]*icon/.test(block)) continue;
      if (/btn-close|btn-icon|btn-link/.test(block)) continue;
      const line = text.slice(0, start).split("\n").length;
      const label = block
        .replace(/<[^>]+>/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      hits.push(`${file.replace(/\\/g, "/")}:${line}  ${label || "(no static label)"}`);
    }
  }
}

console.log(hits.join("\n"));
console.log("\nCOUNT", hits.length);
