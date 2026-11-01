import fs from "fs";
import path from "path";

const itemsDir = path.join(process.cwd(), "public", "items");
if (!fs.existsSync(itemsDir)) {
  fs.mkdirSync(itemsDir, { recursive: true });
}

function createItemSvg(title: string, subtitle: string, iconType: string, accentColor: string): string {
  let iconSvg = "";
  if (iconType === "camera") {
    iconSvg = `
      <rect x="130" y="100" width="140" height="100" rx="14" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="200" cy="150" r="32" fill="#0f172a" stroke="${accentColor}" stroke-width="4"/>
      <circle cx="200" cy="150" r="20" fill="${accentColor}" fill-opacity="0.3"/>
      <circle cx="192" cy="142" r="6" fill="#ffffff" fill-opacity="0.8"/>
      <rect x="155" y="86" width="30" height="14" rx="4" fill="${accentColor}"/>
      <circle cx="245" cy="115" r="5" fill="#ef4444"/>
    `;
  } else if (iconType === "lens") {
    iconSvg = `
      <rect x="140" y="80" width="120" height="140" rx="12" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <ellipse cx="200" cy="80" rx="60" ry="15" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
      <line x1="140" y1="120" x2="260" y2="120" stroke="#475569" stroke-width="2"/>
      <line x1="140" y1="160" x2="260" y2="160" stroke="#475569" stroke-width="2"/>
      <ellipse cx="200" cy="80" rx="40" ry="10" fill="${accentColor}" fill-opacity="0.4"/>
      <text x="200" y="145" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="${accentColor}">24-70mm F2.8</text>
    `;
  } else if (iconType === "gopro") {
    iconSvg = `
      <rect x="135" y="105" width="130" height="90" rx="12" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
      <rect x="145" y="120" width="45" height="45" rx="6" fill="#1e293b"/>
      <circle cx="225" cy="145" r="24" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="225" cy="145" r="14" fill="#3b82f6" fill-opacity="0.5"/>
      <text x="167" y="146" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#38bdf8">5.3K</text>
    `;
  } else if (iconType === "drone") {
    iconSvg = `
      <ellipse cx="200" cy="150" rx="35" ry="25" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <line x1="175" y1="135" x2="130" y2="105" stroke="${accentColor}" stroke-width="4"/>
      <line x1="225" y1="135" x2="270" y2="105" stroke="${accentColor}" stroke-width="4"/>
      <line x1="175" y1="165" x2="130" y2="195" stroke="${accentColor}" stroke-width="4"/>
      <line x1="225" y1="165" x2="270" y2="195" stroke="${accentColor}" stroke-width="4"/>
      <ellipse cx="130" cy="105" rx="20" ry="6" fill="#64748b" fill-opacity="0.6"/>
      <ellipse cx="270" cy="105" rx="20" ry="6" fill="#64748b" fill-opacity="0.6"/>
      <ellipse cx="130" cy="195" rx="20" ry="6" fill="#64748b" fill-opacity="0.6"/>
      <ellipse cx="270" cy="195" rx="20" ry="6" fill="#64748b" fill-opacity="0.6"/>
      <circle cx="200" cy="170" r="10" fill="#38bdf8"/>
    `;
  } else if (iconType === "ebike") {
    iconSvg = `
      <circle cx="140" cy="170" r="30" fill="none" stroke="${accentColor}" stroke-width="5"/>
      <circle cx="260" cy="170" r="30" fill="none" stroke="${accentColor}" stroke-width="5"/>
      <polyline points="140,170 190,170 220,130 170,130 140,170" fill="none" stroke="#f8fafc" stroke-width="4"/>
      <line x1="220" y1="130" x2="260" y2="170" stroke="#f8fafc" stroke-width="4"/>
      <line x1="220" y1="130" x2="210" y2="105" stroke="#f8fafc" stroke-width="4"/>
      <line x1="200" y1="105" x2="225" y2="105" stroke="${accentColor}" stroke-width="5"/>
      <rect x="175" y="138" width="30" height="18" rx="4" fill="${accentColor}"/>
      <text x="190" y="151" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#0f172a">750W</text>
    `;
  } else if (iconType === "tent") {
    iconSvg = `
      <polygon points="200,85 120,195 280,195" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <polygon points="200,85 170,195 230,195" fill="#0f172a" stroke="${accentColor}" stroke-width="2"/>
      <line x1="200" y1="85" x2="200" y2="195" stroke="${accentColor}" stroke-width="2" stroke-dasharray="4,4"/>
      <path d="M 170 195 Q 200 130 230 195 Z" fill="${accentColor}" fill-opacity="0.3"/>
    `;
  } else if (iconType === "speaker") {
    iconSvg = `
      <rect x="150" y="85" width="100" height="135" rx="14" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="200" cy="130" r="22" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="200" cy="180" r="22" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="200" cy="130" r="10" fill="${accentColor}" fill-opacity="0.6"/>
      <circle cx="200" cy="180" r="10" fill="${accentColor}" fill-opacity="0.6"/>
      <rect x="180" y="70" width="40" height="15" rx="4" fill="none" stroke="#64748b" stroke-width="3"/>
    `;
  } else {
    // Projector
    iconSvg = `
      <rect x="140" y="110" width="120" height="85" rx="10" fill="#1e293b" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="175" cy="152" r="18" fill="#0f172a" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="175" cy="152" r="10" fill="#38bdf8" fill-opacity="0.7"/>
      <polygon points="175,152 280,120 280,185" fill="${accentColor}" fill-opacity="0.15"/>
      <line x1="210" y1="135" x2="240" y2="135" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      <line x1="210" y1="150" x2="240" y2="150" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad)"/>
  <circle cx="200" cy="150" r="120" fill="url(#halo)"/>
  ${iconSvg}
  <rect x="20" y="225" width="360" height="55" rx="10" fill="#090d16" fill-opacity="0.9" stroke="#334155" stroke-width="1"/>
  <text x="35" y="248" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">${title}</text>
  <text x="35" y="267" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#94a3b8">${subtitle}</text>
</svg>`;
}

const items = [
  { file: "sony-a7iv.svg", title: "Sony Alpha A7 IV Body", subtitle: "33MP Full-Frame • 4K 60p", icon: "camera", accent: "#38bdf8" },
  { file: "sony-lens.svg", title: "Sony FE 24-70mm f/2.8 GM II", subtitle: "Standard Zoom • G Master", icon: "lens", accent: "#fbbf24" },
  { file: "gopro.svg", title: "GoPro HERO12 Black Kit", subtitle: "5.3K Video • HyperSmooth 6.0", icon: "gopro", accent: "#34d399" },
  { file: "drone.svg", title: "DJI Mini 4 Pro + Fly More", subtitle: "Omni Obstacle Sensing • 4K HDR", icon: "drone", accent: "#a78bfa" },
  { file: "ebike.svg", title: "RadRover 6 Plus E-Bike", subtitle: "750W Motor • 26x4 Fat Tires", icon: "ebike", accent: "#f97316" },
  { file: "tent.svg", title: "Marmot Halo 6-Person Tent", subtitle: "Expedition Grade • Weather Shield", icon: "tent", accent: "#e879f9" },
  { file: "speaker.svg", title: "JBL PartyBox 310 Speaker", subtitle: "240W RMS • Dynamic Lightshow", icon: "speaker", accent: "#f43f5e" },
  { file: "projector.svg", title: "Epson EpiqVision Mini EF12", subtitle: "1080p Laser • Yamaha Audio", icon: "projector", accent: "#2dd4bf" },
];

for (const item of items) {
  const svg = createItemSvg(item.title, item.subtitle, item.icon, item.accent);
  fs.writeFileSync(path.join(itemsDir, item.file), svg, "utf8");
}

console.log("Generated 8 SVG rental item illustrations.");

