// Charger les variables d'environnement
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../utils/db";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";

async function fixExistingUser() {
  console.log("🔧 Creating admin user for custom auth system...");
  
  try {
    // Supprimer l'utilisateur existant s'il existe
    await db.user.deleteMany({
      where: { email: "bruna@example.com" }
    });
    
    console.log("🗑️ Deleted existing user if any");
    
    // Hash le mot de passe
    const hashedPassword = await hashPassword("admin123");
    
    // Créer un nouvel utilisateur avec mot de passe hashé
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        email: "bruna@example.com",
        password: hashedPassword,
        nom_complet: "Bruna Test",
        role: "ADMIN",
        emailVerified: true,
        username: "bruna",
        date_modification: new Date(),
      },
    });
    
    console.log("✅ Created admin user:", user.email);
    console.log("   - ID:", user.id);
    console.log("   - Role:", user.role);
    console.log("   - Password: admin123");
    
    return user;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

async function main() {
  console.log("🛠️ Creating admin user for custom auth system...");
  
  try {
    await fixExistingUser();
    console.log("✅ Admin user created successfully!");
    console.log("💡 You can now login with bruna@example.com / admin123");
  } catch (error) {
    console.error("❌ Error during admin user creation:", error);
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

export { fixExistingUser };