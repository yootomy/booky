import { db } from "../utils/db";
import { hashPassword } from "../lib/auth";
import { randomUUID } from "crypto";

async function createAdmin() {
  console.log("🔐 Creating admin account...");
  
  const email = "bruna@booky.dev";
  const password = "admin123";
  const nom_complet = "Bruna";
  
  try {
    // Hash password with bcrypt (custom auth system)
    const hashedPassword = await hashPassword(password);

    // Créer/mettre à jour l'utilisateur avec mot de passe hashé
    const user = await db.user.upsert({
      where: { email },
      update: {
        nom_complet,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        username: "bruna",
      },
      create: {
        id: randomUUID(),
        email,
        password: hashedPassword,
        nom_complet,
        username: "bruna",
        role: "ADMIN",
        emailVerified: true,
        date_modification: new Date(),
      }
    });

    console.log(`✅ Admin user created/updated: ${user.email}`);
    console.log(`🎯 Admin account ready!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Username: bruna`);
    console.log(`🔑 Role: ${user.role}`);
    
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
  } finally {
    await db.$disconnect();
  }
}

createAdmin();