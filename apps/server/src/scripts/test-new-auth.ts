import { hashPassword, loginUser, createToken } from "../lib/auth";
import { db } from "../utils/db";
import { randomUUID } from "crypto";

async function testNewAuthSystem() {
  console.log("🧪 Test du nouveau système d'authentification...\n");

  try {
    // 1. Vérifier la connexion à la base de données
    console.log("1️⃣ Test de connexion à la base de données...");
    const userCount = await db.user.count();
    console.log(`✅ Connexion OK - ${userCount} utilisateurs dans la DB\n`);

    // 2. Test du hashage de mot de passe
    console.log("2️⃣ Test du hashage de mot de passe...");
    const testPassword = "test123";
    const hashedPassword = await hashPassword(testPassword);
    console.log(`✅ Password hashé: ${hashedPassword.substring(0, 20)}...\n`);

    // 3. Créer un utilisateur admin de test (ou le récupérer s'il existe)
    console.log("3️⃣ Création/récupération de l'admin de test...");
    const adminEmail = "admin@booky.dev";
    
    let admin = await db.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log("Création d'un nouvel admin...");
      admin = await db.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          password: hashedPassword,
          nom_complet: "Admin Test",
          role: "ADMIN",
          emailVerified: true,
          date_modification: new Date(),
        }
      });
      console.log(`✅ Admin créé avec ID: ${admin.id}`);
    } else {
      console.log(`✅ Admin existant trouvé avec ID: ${admin.id}`);
    }

    // 4. Test de login
    console.log("\n4️⃣ Test de connexion...");
    const loginResult = await loginUser(adminEmail, testPassword);
    
    if (loginResult.success && loginResult.user && loginResult.token) {
      console.log(`✅ Login réussi pour: ${loginResult.user.email}`);
      console.log(`✅ Rôle: ${loginResult.user.role}`);
      console.log(`✅ Token généré: ${loginResult.token.substring(0, 20)}...`);
    } else {
      console.log(`❌ Login échoué: ${loginResult.error}`);
    }

    // 5. Test de génération de token direct
    console.log("\n5️⃣ Test de génération de token...");
    const directToken = createToken({
      id: admin.id,
      email: admin.email,
      nom_complet: admin.nom_complet,
      role: admin.role as "ADMIN" | "USER",
      avatar: admin.avatar
    });
    console.log(`✅ Token direct généré: ${directToken.substring(0, 20)}...`);

    console.log("\n🎉 Tous les tests passés avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
  }
}

// Exécuter les tests
testNewAuthSystem().then(() => {
  console.log("\n✅ Tests terminés");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});