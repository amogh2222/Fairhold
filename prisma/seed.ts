import { PrismaClient } from "@prisma/client";
import { DEMO_BUSINESS, DEMO_OWNER, SEED_ITEMS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Fairhold database with demo business and 8 rental items...");

  // 1. Upsert Demo Business
  const business = await prisma.business.upsert({
    where: { slug: DEMO_BUSINESS.slug },
    update: {
      name: DEMO_BUSINESS.name,
      currency: DEMO_BUSINESS.currency,
      contestWindowHours: DEMO_BUSINESS.contestWindowHours,
      wearAndTearPolicy: DEMO_BUSINESS.wearAndTearPolicy,
      aiConfidenceThreshold: DEMO_BUSINESS.aiConfidenceThreshold,
      chargeFeeAtPickup: DEMO_BUSINESS.chargeFeeAtPickup,
      severityMinorPct: DEMO_BUSINESS.severityMinorPct,
      severityModeratePct: DEMO_BUSINESS.severityModeratePct,
      severityMajorPct: DEMO_BUSINESS.severityMajorPct,
    },
    create: {
      id: DEMO_BUSINESS.id,
      name: DEMO_BUSINESS.name,
      slug: DEMO_BUSINESS.slug,
      currency: DEMO_BUSINESS.currency,
      contestWindowHours: DEMO_BUSINESS.contestWindowHours,
      wearAndTearPolicy: DEMO_BUSINESS.wearAndTearPolicy,
      aiConfidenceThreshold: DEMO_BUSINESS.aiConfidenceThreshold,
      chargeFeeAtPickup: DEMO_BUSINESS.chargeFeeAtPickup,
      severityMinorPct: DEMO_BUSINESS.severityMinorPct,
      severityModeratePct: DEMO_BUSINESS.severityModeratePct,
      severityMajorPct: DEMO_BUSINESS.severityMajorPct,
    },
  });

  // 2. Upsert Demo Owner User
  await prisma.ownerUser.upsert({
    where: { email: DEMO_OWNER.email },
    update: {
      name: DEMO_OWNER.name,
      passwordHash: DEMO_OWNER.passwordHash,
      businessId: business.id,
    },
    create: {
      id: DEMO_OWNER.id,
      email: DEMO_OWNER.email,
      name: DEMO_OWNER.name,
      passwordHash: DEMO_OWNER.passwordHash,
      businessId: business.id,
    },
  });

  // 3. Upsert 8 Rental Items
  for (const item of SEED_ITEMS) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        category: item.category,
        description: item.description,
        dailyRate: item.dailyRate,
        depositAmount: item.depositAmount,
        replacementValue: item.replacementValue,
        replacementSources: JSON.stringify(item.replacementSources),
        shotList: JSON.stringify(item.shotList),
        rateCard: JSON.stringify(item.rateCard),
        images: JSON.stringify(item.images),
        inService: item.inService,
        businessId: business.id,
      },
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        dailyRate: item.dailyRate,
        depositAmount: item.depositAmount,
        replacementValue: item.replacementValue,
        replacementSources: JSON.stringify(item.replacementSources),
        shotList: JSON.stringify(item.shotList),
        rateCard: JSON.stringify(item.rateCard),
        images: JSON.stringify(item.images),
        inService: item.inService,
        businessId: business.id,
      },
    });
  }

  console.log(`Seeded business '${business.name}' and ${SEED_ITEMS.length} items successfully.`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

