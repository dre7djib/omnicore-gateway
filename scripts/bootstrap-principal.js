#!/usr/bin/env node
/**
 * One-time bootstrap: assign the Principal role to a user by email.
 * Refuses if a Principal already exists (safety guard).
 *
 * Prerequisites:
 *   1. User must have already signed up via /auth/signup
 *   2. Roles must be seeded: npm run seed:roles
 *
 * Usage: node scripts/bootstrap-principal.js <email>
 * Example: node scripts/bootstrap-principal.js admin@example.com
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/bootstrap-principal.js <email>');
    process.exit(1);
  }

  // Find the Principal role
  const principalRole = await prisma.role.findFirst({ where: { name: 'Principal' } });
  if (!principalRole) {
    console.error('Principal role not found. Run `npm run seed:roles` first.');
    process.exit(1);
  }

  // Check if a Principal already exists
  const existingPrincipal = await prisma.userRole.findFirst({
    where: { roleId: principalRole.id },
  });
  if (existingPrincipal) {
    console.error(`A Principal already exists (userId: ${existingPrincipal.userId}). Aborting.`);
    process.exit(1);
  }

  // Find the user by email
  const user = await prisma.authUser.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email "${email}" not found. Sign up first via /auth/signup.`);
    process.exit(1);
  }

  // Assign Principal role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: principalRole.id,
    },
  });

  console.log(`Principal role assigned to ${email} (userId: ${user.id})`);
}

main()
  .catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
