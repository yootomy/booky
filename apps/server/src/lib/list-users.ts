// Charger les variables d'environnement
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../utils/db";

async function listUsers() {
  console.log("📋 Listing all users in database...");
  
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        nom_complet: true,
        username: true,
        role: true,
        emailVerified: true,
        date_creation: true,
        date_modification: true,
      }
    });
    
    if (users.length === 0) {
      console.log("❌ No users found in database");
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username || 'NULL'}`);
        console.log(`Nom Complet: ${user.nom_complet || 'NULL'}`);
        console.log(`Role: ${user.role}`);
        console.log(`Email Verified: ${user.emailVerified}`);
        console.log(`Date Creation: ${user.date_creation}`);
        console.log(`Date Modification: ${user.date_modification}`);
      });
    }
  } catch (error) {
    console.error("❌ Error listing users:", error);
    throw error;
  }
}

async function main() {
  console.log("🔍 Checking all users...");
  
  try {
    await listUsers();
    console.log("✅ User listing completed!");
  } catch (error) {
    console.error("❌ Error during user listing:", error);
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

export { listUsers };