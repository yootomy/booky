// Charger les variables d'environnement
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../utils/db";
import bcrypt from "bcrypt";

async function checkTestUser() {
  console.log("🔍 Checking test user bruna@example.com...");
  
  try {
    const testUser = await db.user.findUnique({
      where: { email: "bruna@example.com" },
    });
    
    if (testUser) {
      console.log("✅ Test user found:");
      console.log("   - ID:", testUser.id);
      console.log("   - Email:", testUser.email);
      console.log("   - Name:", testUser.nom_complet);
      console.log("   - Role:", testUser.role);
      console.log("   - Email Verified:", testUser.emailVerified);
      console.log("   - Has Password:", testUser.password ? "Yes" : "No");
      console.log("   - Password Hash Length:", testUser.password ? testUser.password.length : "N/A");
      
      // Test du mot de passe
      if (testUser.password) {
        const isValidPassword = await bcrypt.compare("password123", testUser.password);
        console.log("   - Password Test:", isValidPassword ? "✅ Valid" : "❌ Invalid");
      }
    } else {
      console.log("❌ Test user not found");
    }
  } catch (error) {
    console.error("❌ Error checking test user:", error);
    throw error;
  }
}

async function main() {
  console.log("🔍 Checking user in database...");
  
  try {
    await checkTestUser();
    console.log("✅ User check completed successfully!");
  } catch (error) {
    console.error("❌ Error during user check:", error);
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

export { checkTestUser };