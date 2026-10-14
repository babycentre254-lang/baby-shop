/**
 * Usage:
 *   ts-node src/scripts/seed-admin.ts <email>
 *   or via npm:  npm run seed:admin -- jane@example.com
 *
 * Promotes an existing user to SUPER_ADMIN.
 * If the user doesn't exist, creates them with a random password printed to stdout.
 */
import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  const email = (process.argv[2] ?? "").toLowerCase().trim();
  if (!email) {
    console.error("Usage: npm run seed:admin -- <email>");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;
  const users = db.collection("users");

  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { role: "SUPER_ADMIN", updatedAt: new Date() } }
    );
    console.log(`✅ Promoted ${email} to SUPER_ADMIN`);
  } else {
    const password = randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(password, 12);
    await users.insertOne({
      firstName: "Admin",
      lastName: "User",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
      safetyCerts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    console.log(`✅ Created SUPER_ADMIN ${email}`);
    console.log(`   Temporary password: ${password}`);
    console.log(`   Change it after first login.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});