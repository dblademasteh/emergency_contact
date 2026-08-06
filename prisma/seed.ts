import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/passwords";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type SeedContact = {
  name: string;
  phone: string;
  type: string;
  note: string;
  isPrimary?: boolean;
  sortOrder: number;
};

const seeds: SeedContact[] = [
  {
    name: "General Emergency",
    phone: "911",
    type: "EMERGENCY",
    note: "Fire, medical, or crime in progress. Call first in any life-threatening emergency.",
    isPrimary: true,
    sortOrder: 0,
  },
  {
    name: "Poison Control",
    phone: "1-800-222-1222",
    type: "EMERGENCY",
    note: "24/7 guidance for poison exposures and ingestions.",
    isPrimary: true,
    sortOrder: 1,
  },
  {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    type: "MEDICAL",
    note: "Free, confidential crisis support. Call or text anytime.",
    isPrimary: true,
    sortOrder: 2,
  },
  {
    name: "Local Police (non-emergency)",
    phone: "311",
    type: "POLICE",
    note: "For non-urgent incidents and community concerns.",
    sortOrder: 3,
  },
  {
    name: "Local Fire Department (non-emergency)",
    phone: "555-0104",
    type: "FIRE",
    note: "For questions, permits, and smoke alarm checks.",
    sortOrder: 4,
  },
  {
    name: "Urgent Care",
    phone: "555-0105",
    type: "MEDICAL",
    note: "For illness and injuries that are not life-threatening.",
    sortOrder: 5,
  },
  {
    name: "Electricity Outage Line",
    phone: "555-0106",
    type: "UTILITY",
    note: "Report power outages and downed power lines.",
    sortOrder: 6,
  },
  {
    name: "Water & Sewer Emergencies",
    phone: "555-0107",
    type: "UTILITY",
    note: "Burst pipes, leaks, and water quality issues.",
    sortOrder: 7,
  },
  {
    name: "Roadside Assistance",
    phone: "555-0108",
    type: "OTHER",
    note: "Towing, flat tires, and lockouts.",
    sortOrder: 8,
  },
];

const defaultTypes = [
  { value: "EMERGENCY", label: "Emergency", color: "rose", icon: "siren", sortOrder: 0, isDefault: true },
  { value: "POLICE", label: "Police", color: "blue", icon: "shield", sortOrder: 1, isDefault: true },
  { value: "FIRE", label: "Fire", color: "orange", icon: "flame", sortOrder: 2, isDefault: true },
  { value: "MEDICAL", label: "Medical", color: "emerald", icon: "cross", sortOrder: 3, isDefault: true },
  { value: "FAMILY", label: "Family", color: "violet", icon: "users", sortOrder: 4, isDefault: true },
  { value: "UTILITY", label: "Utility", color: "amber", icon: "zap", sortOrder: 5, isDefault: true },
  { value: "OTHER", label: "Other", color: "slate", icon: "more", sortOrder: 6, isDefault: true },
];

async function main() {
  for (const t of defaultTypes) {
    await prisma.contactType.upsert({
      where: { value: t.value },
      update: {},
      create: t,
    });
  }

  const adminSeeds = [
    { username: "admin1", password: randomBytes(12).toString("base64url") },
    { username: "admin2", password: randomBytes(12).toString("base64url") },
    { username: "admin3", password: randomBytes(12).toString("base64url") },
  ];

  for (const a of adminSeeds) {
    const exists = await prisma.admin.findUnique({
      where: { username: a.username },
    });
    if (exists) continue;
    await prisma.admin.create({
      data: { username: a.username, passwordHash: hashPassword(a.password) },
    });
    console.log(`Created admin account: ${a.username} / ${a.password}`);
  }

  const existing = await prisma.contact.count();
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} contact(s) already exist.`);
    return;
  }

  await prisma.contact.createMany({
    data: seeds,
  });
  console.log(`Seeded ${seeds.length} emergency contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
