# Fairhold • Demo Photos Guide for Real Item Testing

This guide instructs owners and hackathon judges on capturing real item photos for inspection verification, or using the built-in demo photo suites.

---

## 1. Directory Structure

Place real photos in the following structure:
```
public/demo-photos/
└── <item-slug>/
    ├── checkout/
    │   ├── shot_front_mount.jpg (or .svg)
    │   ├── shot_rear_lcd.jpg
    │   └── shot_top_dials.jpg
    └── return/
        ├── shot_front_mount_damaged.jpg    <-- Clear NEW DAMAGE
        ├── shot_front_mount_dusty.jpg      <-- Only DUST (non-chargeable)
        └── shot_front_mount_preexisting.jpg<-- Matches PRE-EXISTING mark
```

---

## 2. Test Shots to Take (Sony Alpha A7 IV Camera Body)

### Shot 1: Check-out Baseline (`checkout/shot_front_mount.jpg`)
- **Angle**: Directly in front of the lens mount with the camera body cap removed.
- **Lighting**: Even diffuse lighting across the sensor cavity and chrome lens mount flange.
- **Condition**: Camera clean, but includes a small hairline scratch on the top-right magnesium bezel (acknowledged by renter at checkout).

### Shot 2: Return with Clear New Damage (`return/shot_front_mount_damaged.jpg`)
- **Angle**: Identical angle using Fairhold's ghost overlay.
- **Defect**: Visible scratch or gouge on the sensor optical glass filter (or deep gouge on the bayonet lug).
- **Expected Classification**: `NEW_DAMAGE` (Confidence: > 0.90).
- **Expected Action**: Charged at rate card price ($650 for sensor or $150 for gouge) and deducted from deposit.

### Shot 3: Return with Normal Wear & Cosmetic Dust (`return/shot_front_mount_dusty.jpg`)
- **Angle**: Identical angle.
- **Defect**: Superficial dust particles on the outer mount collar; sensor clean.
- **Expected Classification**: `DIRT_OR_LIGHTING` or `WEAR_AND_TEAR`.
- **Expected Action**: **NON-CHARGEABLE**. Filtered out by the deterministic eligibility engine. Deposit hold released.

### Shot 4: Return with Pre-Existing Mark (`return/shot_front_mount_preexisting.jpg`)
- **Angle**: Identical angle.
- **Defect**: The same top-right magnesium bezel hairline mark from checkout.
- **Expected Classification**: `PRE_EXISTING` (Matched baseline mark ID).
- **Expected Action**: **NON-CHARGEABLE**. Protected under Principle P3.

---

## 3. Judge "Use Demo Photos" Fast-Track

For instant zero-setup demonstration:
1. Open the inspection camera view `/owner/inspect/[bookingId]/checkout` or `/return`.
2. Click **"Load Demo Photos"** in the top-right toolbar.
3. Select between **"New Damage Scenario"**, **"Dust Only Scenario"**, or **"Pre-Existing Mark Scenario"**.
4. The photos are instantly loaded into the AI inspection pipeline!
