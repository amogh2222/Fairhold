export interface SeedItem {
  id: string;
  name: string;
  category: string;
  description: string;
  dailyRate: number;
  depositAmount: number;
  replacementValue: number;
  replacementSources: Array<{ source: string; price: number; url?: string }>;
  shotList: Array<{ key: string; label: string; instructions: string }>;
  rateCard: Array<{ damageType: string; price: number }>;
  images: string[];
  inService: boolean;
}

export const DEMO_BUSINESS = {
  id: "biz_summit_shutter",
  name: "Summit & Shutter Gear Co.",
  slug: "summit-shutter",
  currency: "USD",
  contestWindowHours: 24,
  wearAndTearPolicy:
    "Normal cosmetic dust, minor hairline scuffs on outer protective casings under 5mm, and normal tire tread wear are covered under fair use. Deep gouges exposing bare metal, cracked optical glass or sensors, torn fabric, bent drone propellers or structural chassis damage, and water intrusion are considered chargeable damage.",
  aiConfidenceThreshold: 0.75,
  chargeFeeAtPickup: false,
  severityMinorPct: 0.05,
  severityModeratePct: 0.15,
  severityMajorPct: 0.40,
};

export const DEMO_OWNER = {
  id: "owner_sarah",
  businessId: "biz_summit_shutter",
  email: "owner@summitshutter.com",
  // default password for demo: "fairhold2026"
  passwordHash: "$2a$10$wN1rK4b7K0E11Yf4T9t0.OIaX6lGZ99x1F1v.oJ2nNlE0Hk6u2L/e", // bcrypt for fairhold2026
  name: "Sarah Jenkins",
};

export const SEED_ITEMS: SeedItem[] = [
  {
    id: "item_sony_a7iv",
    name: "Sony Alpha A7 IV Full-Frame Camera Body",
    category: "Camera Body",
    description: "33MP full-frame Exmor R BSI CMOS sensor with 4K 60p 10-bit recording, 759-point AF, and 5.5-stop in-body stabilization. High-demand rental for weddings and commercial shoots.",
    dailyRate: 65.0,
    depositAmount: 400.0,
    replacementValue: 2498.0,
    replacementSources: [
      { source: "B&H Photo Video", price: 2498.0 },
      { source: "Adorama", price: 2498.0 },
      { source: "Best Buy", price: 2499.99 },
    ],
    shotList: [
      { key: "shot_front_mount", label: "Front Mount & Sensor", instructions: "Remove body cap. Frame the lens mount and sensor chamber with straight-on lighting." },
      { key: "shot_rear_lcd", label: "Rear LCD Screen & Controls", instructions: "Extend LCD slightly or keep flush. Capture entire screen surface and D-pad." },
      { key: "shot_top_dials", label: "Top Dials & Hot Shoe", instructions: "Bird's eye view of mode dial, EV compensation, and flash hot shoe." },
      { key: "shot_bottom_base", label: "Bottom Base & Battery Door", instructions: "Inspect tripod mount threads and battery door latch." },
      { key: "shot_left_ports", label: "Left Port Covers", instructions: "Close all rubber port flaps and photograph side profile." },
      { key: "shot_right_grip", label: "Right Grip & Card Slot", instructions: "Inspect textured rubber grip and dual SD/CFexpress door." },
    ],
    rateCard: [
      { damageType: "Sensor Chamber Scratch", price: 650.0 },
      { damageType: "Deep Body / Magnesium Gouge", price: 150.0 },
      { damageType: "LCD Display Scratch / Crack", price: 200.0 },
      { damageType: "Missing Port Cover Door", price: 45.0 },
      { damageType: "Stripped Tripod Mount", price: 120.0 },
    ],
    images: ["/items/sony-a7iv.svg"],
    inService: true,
  },
  {
    id: "item_sony_2470",
    name: "Sony FE 24-70mm f/2.8 GM II Zoom Lens",
    category: "Lens",
    description: "Flagship standard zoom lens featuring XA elements, Nano AR Coating II, four XD linear motors, and aperture ring. Weather-sealed construction.",
    dailyRate: 45.0,
    depositAmount: 300.0,
    replacementValue: 2298.0,
    replacementSources: [
      { source: "B&H Photo Video", price: 2298.0 },
      { source: "Sony Store", price: 2299.99 },
    ],
    shotList: [
      { key: "shot_front_glass", label: "Front Element & Filter Thread", instructions: "Remove lens cap. Angle light across front glass to reveal coating flaws." },
      { key: "shot_rear_element", label: "Rear Element & Metal Mount", instructions: "Inspect rear brass mount, electrical contacts, and rear glass." },
      { key: "shot_barrel_zoom", label: "Barrel & Zoom Ring", instructions: "Extend zoom to 70mm and photograph the inner barrel." },
      { key: "shot_focus_ring", label: "Focus Ring & Switch Panel", instructions: "Frame AF/MF toggle, aperture click switch, and focus ring." },
      { key: "shot_lens_hood", label: "Lens Hood & Bayonet", instructions: "Inspect ALC-SH168 hood for cracks or loose locking pin." },
    ],
    rateCard: [
      { damageType: "Front Glass Scratch", price: 480.0 },
      { damageType: "Rear Element Scratch", price: 420.0 },
      { damageType: "Jammed / Gritty Zoom Mechanism", price: 250.0 },
      { damageType: "Missing Front or Rear Lens Cap", price: 30.0 },
      { damageType: "Cracked Filter Thread", price: 110.0 },
    ],
    images: ["/items/sony-lens.svg"],
    inService: true,
  },
  {
    id: "item_gopro_12",
    name: "GoPro HERO12 Black Action Camera Kit",
    category: "Action Camera",
    description: "Waterproof up to 33ft, 5.3K 60fps video, HyperSmooth 6.0 stabilization, front and rear color screens, includes dual battery charger and magnetic clip mount.",
    dailyRate: 25.0,
    depositAmount: 150.0,
    replacementValue: 399.0,
    replacementSources: [
      { source: "GoPro Official", price: 399.99 },
      { source: "Best Buy", price: 399.99 },
    ],
    shotList: [
      { key: "shot_front_lens", label: "Front Lens Cover & Mini Screen", instructions: "Inspect hydrophobic glass cover and front status display." },
      { key: "shot_rear_touchscreen", label: "Rear Touchscreen", instructions: "Inspect large 2.27-inch display for scratches or impact chips." },
      { key: "shot_battery_door", label: "Side Battery & USB Door", instructions: "Verify waterproof rubber gasket is intact and latch seals firmly." },
      { key: "shot_bottom_fingers", label: "Bottom Folding Mount Fingers", instructions: "Check 1/4-20 tripod threads and folding prong mounts." },
    ],
    rateCard: [
      { damageType: "Cracked Removable Lens Cover", price: 50.0 },
      { damageType: "Rear Screen Crack", price: 140.0 },
      { damageType: "Water Ingress / Damaged Seal", price: 250.0 },
      { damageType: "Lost Battery or Magnetic Mount", price: 35.0 },
    ],
    images: ["/items/gopro.svg"],
    inService: true,
  },
  {
    id: "item_dji_mini4",
    name: "DJI Mini 4 Pro Drone + Fly More Combo",
    category: "Drone",
    description: "Sub-249g ultralight drone with omnidirectional obstacle sensing, 4K/60fps HDR true vertical shooting, 20km FHD transmission, and DJI RC 2 controller with built-in screen.",
    dailyRate: 55.0,
    depositAmount: 350.0,
    replacementValue: 1099.0,
    replacementSources: [
      { source: "DJI Store", price: 1099.0 },
      { source: "Amazon", price: 1099.0 },
    ],
    shotList: [
      { key: "shot_gimbal_camera", label: "Gimbal Camera & Obstacle Sensors", instructions: "Remove gimbal protector. Frame the 3-axis camera and forward vision binocular sensors." },
      { key: "shot_propeller_arms", label: "Propeller Arms & Rotor Blades", instructions: "Unfold all 4 arms. Inspect motor bells and leading edges of blades." },
      { key: "shot_undercarriage", label: "Undercarriage & Auxiliary Light", instructions: "Inspect bottom sensors, downward infrared, and battery retention latch." },
      { key: "shot_rc_controller", label: "DJI RC 2 Controller Screen & Sticks", instructions: "Inspect controller 5.5-inch 700-nit screen and antenna pivots." },
    ],
    rateCard: [
      { damageType: "Gimbal Motor Overload / Misalignment", price: 250.0 },
      { damageType: "Broken Rotor Arm / Motor Housing", price: 180.0 },
      { damageType: "Damaged / Chipped Propeller Pair", price: 25.0 },
      { damageType: "RC Controller Screen Scratch", price: 120.0 },
    ],
    images: ["/items/drone.svg"],
    inService: true,
  },
  {
    id: "item_rad_ebike",
    name: "RadRover 6 Plus Electric All-Terrain Bike",
    category: "E-Bike",
    description: "750W geared hub motor, hydraulic disc brakes, puncture-resistant 26x4 inch fat tires, custom LED display, and 45+ mile range per charge. High-capacity battery pack.",
    dailyRate: 50.0,
    depositAmount: 300.0,
    replacementValue: 1599.0,
    replacementSources: [
      { source: "Rad Power Bikes", price: 1599.0 },
    ],
    shotList: [
      { key: "shot_cockpit_display", label: "Cockpit Handlebar & Display", instructions: "Photograph LCD UI, throttle thumb lever, and brake handles." },
      { key: "shot_drive_train", label: "Drive Train & Rear Derailleur", instructions: "Inspect Shimano 7-speed derailleur cage, chain, and motor cable." },
      { key: "shot_front_wheel", label: "Front Wheel & Hydraulic Rotor", instructions: "Inspect 180mm disc brake rotor, suspension fork, and rim." },
      { key: "shot_rear_wheel", label: "Rear Fat Tire & Motor Hub", instructions: "Inspect tire tread, spoke tension, and rear brake assembly." },
      { key: "shot_frame_battery", label: "Step-Thru Frame & Battery Housing", instructions: "Inspect semi-integrated battery lock and frame finish." },
    ],
    rateCard: [
      { damageType: "Bent Rear Derailleur / Hanger", price: 85.0 },
      { damageType: "Cracked LCD Handlebar Display", price: 120.0 },
      { damageType: "Torn Comfort Saddle", price: 65.0 },
      { damageType: "Bent Brake Rotor / Severed Hydraulic Line", price: 75.0 },
      { damageType: "Punctured Fat Tire Tube", price: 35.0 },
    ],
    images: ["/items/ebike.svg"],
    inService: true,
  },
  {
    id: "item_marmot_tent",
    name: "Marmot Halo 6-Person Expedition Family Tent",
    category: "Tent",
    description: "Expedition-grade 6-person camping tent with halo pole architecture, seam-taped catenary-cut floor, full-coverage fly with dual vestibules, and color-coded DAC DA17 poles.",
    dailyRate: 30.0,
    depositAmount: 150.0,
    replacementValue: 580.0,
    replacementSources: [
      { source: "REI Co-op", price: 580.0 },
      { source: "Marmot", price: 580.0 },
    ],
    shotList: [
      { key: "shot_tent_body", label: "Tent Canopy & Mesh Panels", instructions: "Lay out tent body. Inspect no-see-um mesh walls and door zippers." },
      { key: "shot_rain_fly", label: "Full Coverage Rainfly", instructions: "Inspect polyurethane waterproof fly fabric and guy-out loops." },
      { key: "shot_pole_set", label: "DAC Aluminum Pole Hubs", instructions: "Inspect all interconnected shock-corded aluminum pole sections for bends." },
      { key: "shot_floor_tub", label: "Tub Floor & Corner Seams", instructions: "Inspect Oxford nylon floor for embers, punctures, or seam lift." },
    ],
    rateCard: [
      { damageType: "Fabric Tear / Puncture (> 2 inches)", price: 85.0 },
      { damageType: "Bent / Snapped Aluminum Pole Section", price: 45.0 },
      { damageType: "Broken / Separated Door Zipper", price: 40.0 },
      { damageType: "Missing Stake & Guyline Bundle", price: 25.0 },
    ],
    images: ["/items/tent.svg"],
    inService: true,
  },
  {
    id: "item_jbl_speaker",
    name: "JBL PartyBox 310 Portable Bluetooth Speaker",
    category: "Party Speaker",
    description: "240W RMS output, dynamic light show synchronized to beat, IPX4 splashproof rating, 18-hour battery, smooth-glide wheels and telescopic handle, dual mic/guitar inputs.",
    dailyRate: 40.0,
    depositAmount: 200.0,
    replacementValue: 549.0,
    replacementSources: [
      { source: "JBL Official", price: 549.95 },
      { source: "Crutchfield", price: 549.95 },
    ],
    shotList: [
      { key: "shot_front_grille", label: "Front Speaker Grille & LEDs", instructions: "Inspect front steel mesh and dual 6.5-inch woofer rings." },
      { key: "shot_top_controls", label: "Top Control Panel & Dials", instructions: "Inspect volume dial, bass boost button, and phone slot." },
      { key: "shot_rear_ports", label: "Rear Port Cover & Inputs", instructions: "Inspect waterproof rubber cover, aux, USB, and gain knobs." },
      { key: "shot_wheels_handle", label: "Telescopic Handle & Base Wheels", instructions: "Extend telescopic handle and inspect dual glide wheels." },
    ],
    rateCard: [
      { damageType: "Dented Metal Woofer Grille", price: 95.0 },
      { damageType: "Broken / Jammed Telescopic Handle", price: 75.0 },
      { damageType: "Blown Tweeter / Audio Distortion", price: 160.0 },
      { damageType: "Missing Heavy-Duty AC Power Cable", price: 30.0 },
    ],
    images: ["/items/speaker.svg"],
    inService: true,
  },
  {
    id: "item_epson_projector",
    name: "Epson EpiqVision Mini EF12 Portable Laser Projector",
    category: "Projector",
    description: "Full HD 1080p Micro-Laser Array technology, Yamaha audiophile sound system, Android TV built-in, up to 150-inch display, auto picture skew correction, compact cube form factor.",
    dailyRate: 45.0,
    depositAmount: 250.0,
    replacementValue: 999.0,
    replacementSources: [
      { source: "Epson Official", price: 999.99 },
      { source: "ProjectorPeople", price: 999.0 },
    ],
    shotList: [
      { key: "shot_projection_lens", label: "Front Laser Projection Lens", instructions: "Inspect multi-coated optical lens element for scratches or dust." },
      { key: "shot_top_fabric", label: "Top Acoustical Fabric & Buttons", instructions: "Inspect sound-transparent fabric mesh and power toggle." },
      { key: "shot_side_ports", label: "HDMI Ports & Power Input", instructions: "Inspect dual HDMI (with ARC) ports and 3.5mm audio jack." },
      { key: "shot_bottom_mount", label: "Base & Rubber Foot Pad", instructions: "Inspect bottom ventilation intake and thread mounts." },
    ],
    rateCard: [
      { damageType: "Scratched Laser Projection Lens", price: 280.0 },
      { damageType: "Damaged HDMI Port Pin", price: 140.0 },
      { damageType: "Stained / Torn Acoustical Top Fabric", price: 65.0 },
      { damageType: "Missing Voice Remote Control", price: 45.0 },
    ],
    images: ["/items/projector.svg"],
    inService: true,
  },
];

