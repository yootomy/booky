// Charger les variables d'environnement
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../utils/db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

async function createTestUser() {
  console.log("🔧 Creating test user bruna@example.com...");
  
  // Hasher le mot de passe "password123"
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  try {
    const testUser = await db.user.upsert({
      where: { email: "bruna@example.com" },
      update: {
        password: hashedPassword,
        nom_complet: "Bruna Test",
        role: "ADMIN",
        emailVerified: true,
      },
      create: {
        id: randomUUID(),
        email: "bruna@example.com",
        password: hashedPassword,
        nom_complet: "Bruna Test",
        role: "ADMIN",
        emailVerified: true,
        date_modification: new Date(),
      },
    });
    
    console.log("✅ Test user created/updated:", testUser.email);
    console.log("   - ID:", testUser.id);
    console.log("   - Role:", testUser.role);
    console.log("   - Email Verified:", testUser.emailVerified);
    return testUser;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  }
}

async function main() {
  console.log("🌱 Creating test user for demo...");
  
  try {
    await createTestUser();
    console.log("✅ Test user creation completed successfully!");
  } catch (error) {
    console.error("❌ Error during test user creation:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Toujours exécuter pour ce script utilitaire
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { createTestUser };