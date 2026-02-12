#!/usr/bin/env node
/**
 * Seed the 3 core roles: Principal, Tenant, User.
 * Safe to run multiple times (upsert by name).
 *
 * Usage: node scripts/seed-roles.js
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'Principal', description: 'Global admin — full CRUD, can assign/revoke roles' },
  { name: 'Tenant', description: 'Country-scoped admin — manages products/stock for their country' },
  { name: 'User', description: 'Read-only — browse products, countries, stock' },
];

async function main() {
  console.log('Seeding roles...');

  for (const role of ROLES) {
    const existing = await prisma.role.findFirst({ where: { name: role.name } });
    if (existing) {
      console.log(`  Role "${role.name}" already exists (${existing.id})`);
    } else {
      const created = await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
        },
      });
      console.log(`  Created role "${created.name}" (${created.id})`);
    }
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
