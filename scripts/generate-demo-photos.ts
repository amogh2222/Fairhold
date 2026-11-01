import fs from "fs";
import path from "path";

const demoDir = path.join(process.cwd(), "public", "demo-photos", "sony-a7iv");
const checkoutDir = path.join(demoDir, "checkout");
const returnDir = path.join(demoDir, "return");

fs.mkdirSync(checkoutDir, { recursive: true });
fs.mkdirSync(returnDir, { recursive: true });

function createInspectionPhotoSvg(params: {
  title: string;
  type: "checkout" | "return";
  condition: "clean" | "new_damage" | "dust" | "pre_existing";
}): string {
  const { title, type, condition } = params;

  let artifactSvg = "";
  if (condition === "pre_existing") {
    // A tiny pre-existing hairline scratch on the top-right bezel [ymin: 250, xmin: 650, ymax: 300, xmax: 720]
    artifactSvg = `
      <g id="pre_existing_mark">
        <line x1="520" y1="230" x2="560" y2="250" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <circle cx="540" cy="240" r="18" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="540" y="215" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#60a5fa">Pre-existing Scuff (3mm)</text>
      </g>
    `;
  } else if (condition === "new_damage") {
    // Clear new diagonal scratch across optical sensor glass [ymin: 450, xmin: 400, ymax: 580, xmax: 600]
    artifactSvg = `
      <g id="new_damage_mark">
        <line x1="360" y1="360" x2="440" y2="440" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="400" cy="400" r="28" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ef4444">NEW: Sensor Scratch</text>
      </g>
    `;
  } else if (condition === "dust") {
    // Normal cosmetic surface dust specks
    artifactSvg = `
      <g id="dust_specks">
        <circle cx="380" cy="390" r="1.5" fill="#e2e8f0" opacity="0.6"/>
        <circle cx="410" cy="420" r="1.2" fill="#e2e8f0" opacity="0.5"/>
        <circle cx="395" cy="375" r="1.8" fill="#e2e8f0" opacity="0.7"/>
        <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">Superficial Dust (Wipeable)</text>
      </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <radialGradient id="sensorGleam" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="70%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <linearGradient id="metalBezel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Camera Body Background -->
  <rect width="800" height="600" fill="#0f172a"/>
  
  <!-- Outer Magnesium Chassis -->
  <rect x="150" y="100" width="500" height="420" rx="30" fill="#1e293b" stroke="#334155" stroke-width="4"/>
  <rect x="220" y="60" width="140" height="45" rx="8" fill="#334155"/>
  <circle x="600" y="140" r="15" fill="#dc2626"/>

  <!-- Lens Mount Collar -->
  <circle cx="400" cy="310" r="160" fill="url(#metalBezel)" stroke="#94a3b8" stroke-width="6"/>
  <circle cx="400" cy="310" r="135" fill="#020617" stroke="#475569" stroke-width="4"/>

  <!-- Gold Mount Contacts -->
  <path d="M 330 435 Q 400 455 470 435" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>

  <!-- Sensor Glass & Micro-array -->
  <rect x="330" y="240" width="140" height="140" rx="4" fill="url(#sensorGleam)" stroke="#38bdf8" stroke-width="2"/>
  <rect x="345" y="255" width="110" height="110" rx="2" fill="#020617" stroke="#60a5fa" stroke-width="1" stroke-dasharray="10,10"/>
  
  <!-- Condition Specific Artifacts -->
  ${artifactSvg}

  <!-- Inspection Metadata Overlay -->
  <rect x="30" y="530" width="740" height="45" rx="8" fill="#020617" fill-opacity="0.85" stroke="#1e293b" stroke-width="1"/>
  <text x="50" y="558" font-family="monospace" font-size="12" font-weight="bold" fill="#f8fafc">${title} [${type.toUpperCase()}]</text>
  <text x="650" y="558" font-family="monospace" font-size="11" fill="#38bdf8">${condition.toUpperCase()}</text>
</svg>`;
}

// 1. Checkout photo (has pre-existing hairline mark on bezel)
fs.writeFileSync(
  path.join(checkoutDir, "shot_front_mount.svg"),
  createInspectionPhotoSvg({ title: "Sony A7 IV - Front Mount & Sensor", type: "checkout", condition: "pre_existing" }),
  "utf8"
);

// 2. Return photo 1: Clear NEW DAMAGE (scratch on optical sensor glass)
fs.writeFileSync(
  path.join(returnDir, "shot_front_mount_damaged.svg"),
  createInspectionPhotoSvg({ title: "Sony A7 IV - Return Inspection", type: "return", condition: "new_damage" }),
  "utf8"
);

// 3. Return photo 2: Superficial DUST only (non-chargeable wear & tear)
fs.writeFileSync(
  path.join(returnDir, "shot_front_mount_dusty.svg"),
  createInspectionPhotoSvg({ title: "Sony A7 IV - Return Inspection", type: "return", condition: "dust" }),
  "utf8"
);

// 4. Return photo 3: PRE-EXISTING mark acknowledged at check-out
fs.writeFileSync(
  path.join(returnDir, "shot_front_mount_preexisting.svg"),
  createInspectionPhotoSvg({ title: "Sony A7 IV - Return Inspection", type: "return", condition: "pre_existing" }),
  "utf8"
);

console.log("Generated demo inspection photos in public/demo-photos/sony-a7iv/");

