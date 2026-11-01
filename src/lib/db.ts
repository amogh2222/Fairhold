import { PrismaClient } from "@prisma/client";
import { DEMO_BUSINESS, DEMO_OWNER, SEED_ITEMS, SeedItem } from "./seed-data";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })
    : (null as unknown as PrismaClient));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

interface MemoryStore {
  businesses: Map<string, any>;
  ownerUsers: Map<string, any>;
  items: Map<string, any>;
  bookings: Map<string, any>;
  authorizations: Map<string, any>;
  inspections: Map<string, any>;
  photos: Map<string, any>;
  baselineMarks: Map<string, any>;
  findings: Map<string, any>;
  proposals: Map<string, any>;
  contestItems: Map<string, any>;
  captures: Map<string, any>;
  refunds: Map<string, any>;
  disputes: Map<string, any>;
  webhookEvents: Map<string, any>;
  auditEvents: Array<any>;
  jobQueue: Map<string, any>;
}

const globalForMemory = globalThis as unknown as {
  memoryStore: MemoryStore | undefined;
};

function getMemoryStore(): MemoryStore {
  if (!globalForMemory.memoryStore) {
    const store: MemoryStore = {
      businesses: new Map(),
      ownerUsers: new Map(),
      items: new Map(),
      bookings: new Map(),
      authorizations: new Map(),
      inspections: new Map(),
      photos: new Map(),
      baselineMarks: new Map(),
      findings: new Map(),
      proposals: new Map(),
      contestItems: new Map(),
      captures: new Map(),
      refunds: new Map(),
      disputes: new Map(),
      webhookEvents: new Map(),
      auditEvents: [],
      jobQueue: new Map(),
    };

    // Pre-seed business
    store.businesses.set(DEMO_BUSINESS.id, {
      ...DEMO_BUSINESS,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Pre-seed owner user
    store.ownerUsers.set(DEMO_OWNER.id, {
      ...DEMO_OWNER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Pre-seed 8 items
    for (const item of SEED_ITEMS) {
      store.items.set(item.id, {
        ...item,
        businessId: DEMO_BUSINESS.id,
        shotList: JSON.stringify(item.shotList),
        rateCard: JSON.stringify(item.rateCard),
        replacementSources: JSON.stringify(item.replacementSources),
        images: JSON.stringify(item.images),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    globalForMemory.memoryStore = store;
  }
  return globalForMemory.memoryStore;
}

let isPrismaAvailable: boolean | null = null;

async function checkPrisma(): Promise<boolean> {
  if (isPrismaAvailable !== null) return isPrismaAvailable;
  if (!process.env.DATABASE_URL || !prisma) {
    isPrismaAvailable = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
    return true;
  } catch (err: any) {
    console.warn("Prisma PostgreSQL unavailable, operating in in-memory resilient mode:", err.message);
    isPrismaAvailable = false;
    return false;
  }
}

export const db = {
  business: {
    async findUnique(args: { where: { id?: string; slug?: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.business.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      if (args.where.id) return store.businesses.get(args.where.id) || null;
      if (args.where.slug) {
        for (const b of store.businesses.values()) {
          if (b.slug === args.where.slug) return b;
        }
      }
      return null;
    },
    async findFirst(args?: { where?: any; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.business.findFirst(args as any); } catch {}
      }
      const store = getMemoryStore();
      const list = Array.from(store.businesses.values());
      return list[0] || null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.business.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "biz_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.businesses.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.business.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.businesses.get(args.where.id);
      if (!existing) throw new Error("Business not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      store.businesses.set(args.where.id, updated);
      return updated;
    },
  },

  ownerUser: {
    async findUnique(args: { where: { email?: string; id?: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.ownerUser.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      if (args.where.id) return store.ownerUsers.get(args.where.id) || null;
      if (args.where.email) {
        for (const u of store.ownerUsers.values()) {
          if (u.email.toLowerCase() === args.where.email.toLowerCase()) return u;
        }
      }
      return null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.ownerUser.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "owner_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.ownerUsers.set(id, record);
      return record;
    },
  },

  item: {
    async findMany(args?: { where?: any; orderBy?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.item.findMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      let list = Array.from(store.items.values());
      if (args?.where) {
        if (args.where.businessId) list = list.filter((i) => i.businessId === args.where.businessId);
        if (args.where.category) list = list.filter((i) => i.category === args.where.category);
        if (args.where.inService !== undefined) list = list.filter((i) => i.inService === args.where.inService);
      }
      return list;
    },
    async findUnique(args: { where: { id: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.item.findUnique(args); } catch {}
      }
      const store = getMemoryStore();
      return store.items.get(args.where.id) || null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.item.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "item_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.items.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.item.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.items.get(args.where.id);
      if (!existing) throw new Error("Item not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      store.items.set(args.where.id, updated);
      return updated;
    },
  },

  booking: {
    async findMany(args?: { where?: any; include?: any; orderBy?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.booking.findMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      let list = Array.from(store.bookings.values());
      if (args?.where) {
        if (args.where.businessId) list = list.filter((b) => b.businessId === args.where.businessId);
        if (args.where.itemId) list = list.filter((b) => b.itemId === args.where.itemId);
        if (args.where.status) list = list.filter((b) => b.status === args.where.status);
      }
      return list.map((b) => this._hydrate(b, args?.include));
    },
    async findUnique(args: { where: { id?: string; renterToken?: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.booking.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      let found: any = null;
      if (args.where.id) found = store.bookings.get(args.where.id);
      else if (args.where.renterToken) {
        for (const b of store.bookings.values()) {
          if (b.renterToken === args.where.renterToken) { found = b; break; }
        }
      }
      return found ? this._hydrate(found, args?.include) : null;
    },
    async findFirst(args: { where: any; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.booking.findFirst(args as any); } catch {}
      }
      const store = getMemoryStore();
      for (const b of store.bookings.values()) {
        let match = true;
        if (args.where.paypalOrderId && b.paypalOrderId !== args.where.paypalOrderId) match = false;
        if (match) return this._hydrate(b, args?.include);
      }
      return null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.booking.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "bk_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.bookings.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.booking.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.bookings.get(args.where.id);
      if (!existing) throw new Error("Booking not found: " + args.where.id);
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      store.bookings.set(args.where.id, updated);
      return updated;
    },
    _hydrate(booking: any, include?: any) {
      const store = getMemoryStore();
      const res = { ...booking };
      if (include?.item) res.item = store.items.get(booking.itemId);
      if (include?.business) res.business = store.businesses.get(booking.businessId);
      if (include?.authorizations) {
        res.authorizations = Array.from(store.authorizations.values()).filter((a) => a.bookingId === booking.id);
      }
      if (include?.inspections) {
        res.inspections = Array.from(store.inspections.values())
          .filter((i) => i.bookingId === booking.id)
          .map((i) => db.inspection._hydrate(i, include?.inspections?.include));
      }
      if (include?.proposals) {
        res.proposals = Array.from(store.proposals.values())
          .filter((p) => p.bookingId === booking.id)
          .map((p) => db.settlementProposal._hydrate(p, include?.proposals?.include));
      }
      if (include?.captures) {
        res.captures = Array.from(store.captures.values()).filter((c) => c.bookingId === booking.id);
      }
      if (include?.disputes) {
        res.disputes = Array.from(store.disputes.values()).filter((d) => d.bookingId === booking.id);
      }
      return res;
    },
  },

  authorizationRecord: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.authorizationRecord.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "auth_rec_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.authorizations.set(id, record);
      return record;
    },
    async findUnique(args: { where: { id?: string; paypalAuthId?: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.authorizationRecord.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      if (args.where.id) return store.authorizations.get(args.where.id) || null;
      if (args.where.paypalAuthId) {
        for (const a of store.authorizations.values()) {
          if (a.paypalAuthId === args.where.paypalAuthId) return a;
        }
      }
      return null;
    },
    async findFirst(args: { where: { bookingId?: string; paypalAuthId?: string; status?: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.authorizationRecord.findFirst(args as any); } catch {}
      }
      const store = getMemoryStore();
      for (const a of store.authorizations.values()) {
        if (args.where.bookingId && a.bookingId !== args.where.bookingId) continue;
        if (args.where.paypalAuthId && a.paypalAuthId !== args.where.paypalAuthId) continue;
        if (args.where.status && a.status !== args.where.status) continue;
        return a;
      }
      return null;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.authorizationRecord.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.authorizations.get(args.where.id);
      if (!existing) return null;
      const updated = { ...existing, ...args.data };
      store.authorizations.set(args.where.id, updated);
      return updated;
    },
    async findMany(args: { where: { bookingId: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.authorizationRecord.findMany(args); } catch {}
      }
      const store = getMemoryStore();
      return Array.from(store.authorizations.values()).filter((a) => a.bookingId === args.where.bookingId);
    },
  },

  inspection: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.inspection.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "insp_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.inspections.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.inspection.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.inspections.get(args.where.id);
      if (!existing) throw new Error("Inspection not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      store.inspections.set(args.where.id, updated);
      return updated;
    },
    async findUnique(args: { where: { id: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.inspection.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      const i = store.inspections.get(args.where.id);
      return i ? this._hydrate(i, args?.include) : null;
    },
    async findFirst(args: { where: { bookingId: string; type?: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.inspection.findFirst(args as any); } catch {}
      }
      const store = getMemoryStore();
      for (const i of store.inspections.values()) {
        if (i.bookingId === args.where.bookingId && (!args.where.type || i.type === args.where.type)) {
          return this._hydrate(i, args?.include);
        }
      }
      return null;
    },
    _hydrate(inspection: any, include?: any) {
      const store = getMemoryStore();
      const res = { ...inspection };
      if (include?.photos) {
        res.photos = Array.from(store.photos.values()).filter((p) => p.inspectionId === inspection.id);
      }
      if (include?.baselineMarks) {
        res.baselineMarks = Array.from(store.baselineMarks.values()).filter((m) => m.inspectionId === inspection.id);
      }
      if (include?.findings) {
        res.findings = Array.from(store.findings.values()).filter((f) => f.inspectionId === inspection.id);
      }
      return res;
    },
  },

  photo: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.photo.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "photo_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.photos.set(id, record);
      return record;
    },
    async findMany(args: { where: { inspectionId: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.photo.findMany(args); } catch {}
      }
      const store = getMemoryStore();
      return Array.from(store.photos.values()).filter((p) => p.inspectionId === args.where.inspectionId);
    },
  },

  baselineMark: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.baselineMark.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "mark_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.baselineMarks.set(id, record);
      return record;
    },
    async findMany(args: { where: { photoId?: string; inspectionId?: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.baselineMark.findMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      return Array.from(store.baselineMarks.values()).filter((m) => {
        if (args.where.photoId && m.photoId !== args.where.photoId) return false;
        if (args.where.inspectionId && m.inspectionId !== args.where.inspectionId) return false;
        return true;
      });
    },
  },

  finding: {
    async findUnique(args: { where: { id: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.finding.findUnique(args); } catch {}
      }
      const store = getMemoryStore();
      return store.findings.get(args.where.id) || null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.finding.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "find_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.findings.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.finding.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.findings.get(args.where.id);
      if (!existing) throw new Error("Finding not found");
      const updated = { ...existing, ...args.data };
      store.findings.set(args.where.id, updated);
      return updated;
    },
    async findMany(args: { where: { inspectionId: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.finding.findMany(args); } catch {}
      }
      const store = getMemoryStore();
      return Array.from(store.findings.values()).filter((f) => f.inspectionId === args.where.inspectionId);
    },
  },

  settlementProposal: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.settlementProposal.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "prop_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.proposals.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.settlementProposal.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.proposals.get(args.where.id);
      if (!existing) throw new Error("Proposal not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      store.proposals.set(args.where.id, updated);
      return updated;
    },
    async findUnique(args: { where: { id: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.settlementProposal.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      const p = store.proposals.get(args.where.id);
      return p ? this._hydrate(p, args?.include) : null;
    },
    async findFirst(args: { where: { bookingId: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.settlementProposal.findFirst(args as any); } catch {}
      }
      const store = getMemoryStore();
      for (const p of store.proposals.values()) {
        if (p.bookingId === args.where.bookingId) return this._hydrate(p, args?.include);
      }
      return null;
    },
    _hydrate(proposal: any, include?: any) {
      const store = getMemoryStore();
      const res = { ...proposal };
      if (include?.contestItems) {
        res.contestItems = Array.from(store.contestItems.values()).filter((c) => c.proposalId === proposal.id);
      }
      return res;
    },
  },

  contestItem: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.contestItem.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "contest_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.contestItems.set(id, record);
      return record;
    },
    async update(args: { where: { id: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.contestItem.update(args); } catch {}
      }
      const store = getMemoryStore();
      const existing = store.contestItems.get(args.where.id);
      if (!existing) throw new Error("Contest item not found");
      const updated = { ...existing, ...args.data };
      store.contestItems.set(args.where.id, updated);
      return updated;
    },
  },

  capture: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.capture.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "cap_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.captures.set(record.paypalCaptureId || id, record);
      return record;
    },
    async findUnique(args: { where: { paypalCaptureId?: string; id?: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.capture.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      if (args.where.paypalCaptureId) {
        for (const c of store.captures.values()) {
          if (c.paypalCaptureId === args.where.paypalCaptureId) return c;
        }
      }
      if (args.where.id) return store.captures.get(args.where.id) || null;
      return null;
    },
    async update(args: { where: { id?: string; paypalCaptureId?: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.capture.update(args as any); } catch {}
      }
      const store = getMemoryStore();
      let match: any = null;
      if (args.where.id) match = store.captures.get(args.where.id);
      else if (args.where.paypalCaptureId) {
        for (const c of store.captures.values()) {
          if (c.paypalCaptureId === args.where.paypalCaptureId) { match = c; break; }
        }
      }
      if (!match) return null;
      const updated = { ...match, ...args.data };
      store.captures.set(match.id, updated);
      return updated;
    },
    async updateMany(args: { where: { paypalCaptureId?: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.capture.updateMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      for (const c of store.captures.values()) {
        if (c.paypalCaptureId === args.where.paypalCaptureId) {
          Object.assign(c, args.data);
        }
      }
      return { count: 1 };
    },
  },

  refund: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.refund.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "ref_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.refunds.set(id, record);
      return record;
    },
  },

  dispute: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.dispute.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "disp_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      store.disputes.set(record.paypalDisputeId || id, record);
      return record;
    },
    async update(args: { where: { paypalDisputeId?: string; id?: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.dispute.update(args as any); } catch {}
      }
      const store = getMemoryStore();
      let match: any = null;
      if (args.where.paypalDisputeId) match = store.disputes.get(args.where.paypalDisputeId);
      else if (args.where.id) match = store.disputes.get(args.where.id);
      if (!match) throw new Error("Dispute not found");
      const updated = { ...match, ...args.data, updatedAt: new Date() };
      store.disputes.set(match.paypalDisputeId, updated);
      return updated;
    },
    async findUnique(args: { where: { paypalDisputeId?: string; id?: string }; include?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.dispute.findUnique(args as any); } catch {}
      }
      const store = getMemoryStore();
      let match: any = null;
      if (args.where.paypalDisputeId) match = store.disputes.get(args.where.paypalDisputeId);
      else if (args.where.id) match = store.disputes.get(args.where.id);
      return match || null;
    },
    async findMany(args?: { where?: any; include?: any; orderBy?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.dispute.findMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      return Array.from(store.disputes.values());
    },
  },

  webhookEvent: {
    async findUnique(args: { where: { paypalEventId: string } }) {
      if (await checkPrisma()) {
        try { return await prisma.webhookEvent.findUnique(args); } catch {}
      }
      const store = getMemoryStore();
      return store.webhookEvents.get(args.where.paypalEventId) || null;
    },
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.webhookEvent.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "evt_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.webhookEvents.set(args.data.paypalEventId, record);
      return record;
    },
    async update(args: { where: { paypalEventId?: string; id?: string }; data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.webhookEvent.update(args as any); } catch {}
      }
      const store = getMemoryStore();
      const key = args.where.paypalEventId || args.where.id || "";
      const existing = store.webhookEvents.get(key);
      if (!existing) return null;
      const updated = { ...existing, ...args.data };
      store.webhookEvents.set(key, updated);
      return updated;
    },
  },

  auditEvent: {
    async create(args: { data: any }) {
      if (await checkPrisma()) {
        try { return await prisma.auditEvent.create(args); } catch {}
      }
      const store = getMemoryStore();
      const id = args.data.id || "audit_" + Math.random().toString(36).substring(2, 9);
      const record = { ...args.data, id, createdAt: new Date() };
      store.auditEvents.push(record);
      return record;
    },
    async findMany(args: { where: { bookingId?: string }; orderBy?: any }) {
      if (await checkPrisma()) {
        try { return await prisma.auditEvent.findMany(args as any); } catch {}
      }
      const store = getMemoryStore();
      let list = store.auditEvents;
      if (args.where.bookingId) list = list.filter((e) => e.bookingId === args.where.bookingId);
      return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
  },

  async resetDemoData() {
    const store = getMemoryStore();
    store.bookings.clear();
    store.authorizations.clear();
    store.inspections.clear();
    store.photos.clear();
    store.baselineMarks.clear();
    store.findings.clear();
    store.proposals.clear();
    store.contestItems.clear();
    store.captures.clear();
    store.refunds.clear();
    store.disputes.clear();
    store.webhookEvents.clear();
    store.auditEvents = [];
    store.items.clear();
    for (const item of SEED_ITEMS) {
      store.items.set(item.id, {
        ...item,
        businessId: DEMO_BUSINESS.id,
        shotList: JSON.stringify(item.shotList),
        rateCard: JSON.stringify(item.rateCard),
        replacementSources: JSON.stringify(item.replacementSources),
        images: JSON.stringify(item.images),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },
};
