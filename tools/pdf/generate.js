// Generates Deployment-Guide.pdf from the emergency-contacts project.
// Run: node tools/pdf/generate.js
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const OUT = path.join(__dirname, "..", "..", "docs", "Deployment-Guide.pdf");

const ACCENT = "#dc2626";
const INK = "#1f2937";
const MUTED = "#6b7280";
const CODE_BG = "#f3f4f6";
const CODE_BORDER = "#d1d5db";
const HEAD_BG = "#111827";

const MARGIN = 48;
const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 48, bottom: 48, left: MARGIN, right: MARGIN },
  bufferPages: true,
  info: {
    Title: "Emergency Contacts — Deployment Guide",
    Author: "Emergency Contacts",
    Subject: "How to update, deploy, and access the app from anywhere",
  },
});

const out = fs.createWriteStream(OUT);
doc.pipe(out);

let y = doc.y;
const ensure = (space = 20) => {
  if (y > PAGE_H - 80) {
    doc.addPage();
    y = doc.y;
  }
  y += space;
};

function title(text, sub) {
  // Header band
  doc.roundedRect(MARGIN, y, CONTENT_W, 74, 8).fill(HEAD_BG);
  doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text(text, MARGIN + 16, y + 16, { width: CONTENT_W - 32 });
  if (sub) {
    doc.fillColor("#c7d2fe").fontSize(11).font("Helvetica").text(sub, MARGIN + 16, y + 46, { width: CONTENT_W - 32 });
  }
  y += 96;
}

function h2(text) {
  ensure(30);
  doc.fillColor(ACCENT).fontSize(15).font("Helvetica-Bold").text(text, MARGIN, y);
  doc.moveTo(MARGIN, y + 15).lineTo(MARGIN + CONTENT_W, y + 15).lineWidth(1.5).strokeColor(ACCENT).stroke();
  y += 26;
}

function h3(text) {
  ensure(20);
  doc.fillColor(INK).fontSize(12).font("Helvetica-Bold").text(text, MARGIN, y);
  y += 16;
}

function para(text, opts = {}) {
  ensure(opts.space ?? 8);
  doc.fillColor(opts.color ?? INK).fontSize(10).font(opts.bold ? "Helvetica-Bold" : "Helvetica");
  const h = doc.heightOfString(text, { width: CONTENT_W });
  if (y + h > PAGE_H - 60) {
    doc.addPage();
    y = doc.y;
  }
  doc.text(text, MARGIN, y, { width: CONTENT_W });
  y += h + 4;
}

function bullets(items) {
  ensure(8);
  for (const it of items) {
    const text = it;
    doc.fillColor(INK).fontSize(10).font("Helvetica");
    const h = doc.heightOfString(text, { width: CONTENT_W - 16 });
    if (y + h > PAGE_H - 60) {
      doc.addPage();
      y = doc.y;
    }
    doc.fillColor(ACCENT).fontSize(10).text("\u2022", MARGIN, y);
    doc.fillColor(INK).text(text, MARGIN + 12, y, { width: CONTENT_W - 16 });
    y += h + 4;
  }
}

function codeBlock(lines) {
  ensure(8);
  const blockH = 12 + lines.length * 13.5;
  if (y + blockH > PAGE_H - 60) {
    doc.addPage();
    y = doc.y;
  }
  // background
  doc.roundedRect(MARGIN, y, CONTENT_W, blockH, 4).fill(CODE_BG);
  // accent bar
  doc.rect(MARGIN, y, 3, blockH).fill(ACCENT);
  lines.forEach((ln, i) => {
    doc.fillColor("#1f2937").font("Courier-Bold").fontSize(9.5).text(ln, MARGIN + 14, y + 8 + i * 13.5);
  });
  y += blockH + 8;
}

function tipBox(text) {
  ensure(8);
  doc.roundedRect(MARGIN, y, CONTENT_W, 34, 5).fill("#fafafa").strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.fillColor(INK).font("Helvetica").fontSize(10).text(text, MARGIN + 12, y + 10, { width: CONTENT_W - 24 });
  y += 42;
}

function table(rows, colWidths) {
  ensure(8);
  const cellPad = 6;
  const rowH = 24;
  const headerH = 26;
  const totalH = headerH + rows.length * rowH;
  if (y + totalH > PAGE_H - 60) {
    doc.addPage();
    y = doc.y;
  }
  let x = MARGIN;
  // header
  doc.rect(MARGIN, y, CONTENT_W, headerH).fill(HEAD_BG);
  colWidths.forEach((w, i) => {
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9.5).text(rows.header[i], x + cellPad, y + 8, { width: w - cellPad * 2 });
    x += w;
  });
  y += headerH;
  // rows
  rows.data.forEach((row, r) => {
    if (r % 2 === 1) doc.rect(MARGIN, y, CONTENT_W, rowH).fill("#fafafa");
    x = MARGIN;
    row.forEach((cell, i) => {
      doc.fillColor(INK).font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      if (/^[a-z ]+$/.test(cell) || cell.includes(" ") && cell.length > 30) {
        doc.font(i === 0 ? "Helvetica-Bold" : "Courier").fontSize(9);
      }
      doc.text(cell, x + cellPad, y + 7, { width: colWidths[i] - cellPad * 2 });
      x += colWidths[i];
    });
    y += rowH;
  });
  y += 8;
}

// ---------------------------------------------------------------- content
title(
  "Emergency Contacts — Deployment Guide",
  "How to update, deploy, and access your app from anywhere on your Synology NAS"
);

h2("1 · Your Setup at a Glance");
table(
  {
    header: ["Piece", "Where it lives"],
    data: [
      ["App", "Next.js + PostgreSQL, running in Docker on your NAS"],
      ["Source code", "GitHub: github.com/dblademasteh/emergency_contact (branch main)"],
      ["NAS folder", "/volume1/docker/emergency_contact"],
      ["Local access", "http://192.168.0.148:8080  (login: /login)"],
      ["Outside access", "Cloudflare Tunnel — public HTTPS URL, no port forwarding"],
    ],
  },
  [130, CONTENT_W - 130]
);

h2("2 · Deploy Changes to Production");
para("Step 1 — On your PC, commit & push after editing:", { space: 4 });
codeBlock([
  "git add -A",
  'git commit -m "describe your change"',
  "git push",
]);
para("Step 2 — SSH into the NAS, then pull the new code:", { space: 4 });
codeBlock([
  "ssh bfpr2@192.168.0.148",
  "cd /volume1/docker/emergency_contact",
  "git pull",
]);
para("Step 3 — Rebuild & restart the app container:", { space: 4 });
codeBlock(["sudo docker compose up -d --build"]);
tipBox("Tip: Database migrations run automatically on container start — no manual step needed.");

h2("3 · Access From Outside the Network");
para("Your app is already exposed via a Cloudflare Tunnel:", { space: 4 });
codeBlock([
  "https://26239e73-fdc0-4272-b1c5-6b5ef0a57a5d.cfargotunnel.com",
  "Login page: .../cfargotunnel.com/login",
]);
para("Check the tunnel is running (on the NAS):", { space: 4 });
codeBlock(["sudo docker compose ps"]);
para("Look for emergency-contacts-cloudflared as Up. If not, run: sudo docker compose up -d");
para("Test from your phone on mobile data (Wi-Fi off) to confirm it works outside your home.");

h2("4 · Admin Access to the NAS From Anywhere");
para("To deploy you need a shell on the NAS — not just the app. Three ways, easiest first:");
h3("Option A — Synology QuickConnect (no extra software)");
bullets([
  "Enable: Control Panel → External Access → QuickConnect → sign in with a Synology Account",
  "From anywhere open https://quickconnect.to/<your-id> → log into DSM",
  "Open the Terminal app (Main Menu) → you're at the NAS shell → run the deploy commands",
]);
h3("Option B — SSH via QuickConnect (use your PC's terminal)");
codeBlock(["ssh -p <port> bfpr2@<your-id>.quickconnect.to"]);
para("Find <port> and <your-id> in Control Panel → External Access → QuickConnect → Advanced (enable SSH there).", { space: 4 });
h3("Option C — Tailscale (recommended for speed)");
bullets([
  "Install the Tailscale package on the NAS and app on your devices",
  "Gives the NAS a stable IP that works from anywhere (peer-to-peer, faster than QuickConnect)",
  "Then SSH normally and deploy",
]);

h2("5 · Deploying a New Project");
para("Use this app as your template — same recipe every time:", { space: 4 });
codeBlock([
  "sudo mkdir /volume1/docker/mynewapp",
  "cd /volume1/docker/mynewapp",
  "git clone https://github.com/you/mynewapp.git .",
  "sudo cp /volume1/docker/emergency_contact/.env ./.env   # edit passwords + DB name",
  "sudo cp /volume1/docker/emergency_contact/Dockerfile .",
  "sudo cp /volume1/docker/emergency_contact/docker-compose.yml .",
]);
para("Then edit docker-compose.yml: change the name, container_name, and ports (e.g. 8081:3000) so it doesn't clash. Build & start:", { space: 4 });
codeBlock(["sudo docker compose up -d --build"]);
para("For public access, copy the cloudflared service block from this project's compose and create a new tunnel.", { space: 4 });

h2("6 · Quick Command Reference");
table(
  {
    header: ["Task", "Command"],
    data: [
      ["Deploy app changes", "git pull && sudo docker compose up -d --build"],
      ["Just restart (no code change)", "sudo docker compose up -d"],
      ["See container status", "sudo docker compose ps"],
      ["View app logs", "sudo docker compose logs -f app"],
      ["Create admin accounts (prints credentials)", "sudo docker compose exec app npx prisma db seed"],
      ["Rebuild everything from scratch", "sudo docker compose down && sudo docker compose up -d --build"],
    ],
  },
  [CONTENT_W * 0.42, CONTENT_W * 0.58]
);

h2("7 · Troubleshooting");
h3("Seed error: Cannot find module '../lib/passwords'");
para("The container was missing the lib/ folder. Quick fix without rebuilding:", { space: 4 });
codeBlock([
  "sudo docker cp /volume1/docker/emergency_contact/lib emergency-contacts:/app/",
  "sudo docker compose exec app npx prisma db seed",
]);
para("The Dockerfile has been updated to copy lib/, so a normal rebuild prevents this permanently.", { space: 4 });
h3("Forgot the admin password?");
para("There is no default password. Re-run the seed — it creates admin1, admin2, admin3 with random passwords printed to the console. Copy them immediately (shown only once).", { space: 4 });

// footer page numbers
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc
    .fillColor(MUTED)
    .fontSize(9)
    .font("Helvetica")
    .text(`Page ${i + 1} of ${range.count}`, MARGIN, PAGE_H - 32, { width: CONTENT_W, align: "center" });
}

doc.end();
out.on("finish", () => {
  console.log(`✅ PDF written to ${OUT}`);
});
