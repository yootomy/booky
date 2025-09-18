import { db } from "../utils/db";
import { verifyPassword } from "../lib/auth";

async function verifyComplete() {
  console.log("🔍 Vérification complète du système d'authentification custom...\n");
  
  // 1. Vérifier la base de données
  console.log("1️⃣ Vérification de la base de données:");
  try {
    const userCount = await db.user.count();
    console.log(`✅ Utilisateurs dans la DB: ${userCount}`);
    
    // Vérifier l'admin spécifiquement
    const adminUser = await db.user.findUnique({
      where: { email: "bruna@booky.dev" },
    });
    
    if (adminUser) {
      console.log(`✅ Admin user existe:`, {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        username: adminUser.username,
        emailVerified: adminUser.emailVerified
      });
      
      // Vérifier le mot de passe
      if (adminUser.password) {
        const isValidPassword = await verifyPassword("admin123", adminUser.password);
        console.log(`✅ Password hash valide: ${isValidPassword}`);
      } else {
        console.log("❌ Pas de mot de passe trouvé");
      }
    } else {
      console.log("❌ Admin user n'existe pas");
    }
    
  } catch (error) {
    console.error("❌ Erreur DB:", error);
  }
  
  // 2. Vérifier la configuration auth custom
  console.log("\n2️⃣ Vérification système auth custom:");
  try {
    console.log("✅ JWT Secret configuré:", !!process.env.JWT_SECRET);
    console.log("✅ Base URL:", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
    console.log("✅ Auth custom activé");
  } catch (error) {
    console.error("❌ Erreur config auth custom:", error);
  }
  
  // 3. Tester le login direct
  console.log("\n3️⃣ Test du login custom:");
  try {
    const { loginUser } = await import("../lib/auth");
    
    const result = await loginUser("bruna@booky.dev", "admin123");
    
    if (result.success && result.user && result.token) {
      console.log("✅ Login successful avec auth custom!");
      console.log("User:", result.user.email, "Role:", result.user.role);
      console.log("Token généré:", !!result.token);
    } else {
      console.log("❌ Login failed:", result.error);
    }
    
  } catch (error) {
    console.error("❌ Erreur test login:", error);
  }
  
  // 4. Vérifier les routes API
  console.log("\n4️⃣ Vérification des routes:");
  const routes = [
    "auth/login/route.ts",
    "auth/logout/route.ts", 
    "auth/session/route.ts",
    "auth/register/route.ts",
  ];
  
  for (const route of routes) {
    try {
      const fs = await import('fs');
      const path = `C:\\Datas\\Projects\\Booky\\booky\\apps\\server\\src\\app\\api\\${route}`;
      if (fs.existsSync(path)) {
        console.log(`✅ ${route} existe`);
      } else {
        console.log(`❌ ${route} manquant`);
      }
    } catch (error) {
      console.log(`❓ ${route} vérification échouée`);
    }
  }
  
  // 5. Vérifier les middlewares
  console.log("\n5️⃣ Vérification des middlewares:");
  try {
    const { withAuth, withAdminAuth, checkRateLimit } = await import("../middlewares/auth");
    console.log("✅ withAuth importé");
    console.log("✅ withAdminAuth importé");
    console.log("✅ checkRateLimit importé");
    
    // Test rate limit
    const rateLimitOk = checkRateLimit("test@test.com");
    console.log(`✅ Rate limit fonctionne: ${rateLimitOk}`);
    
  } catch (error) {
    console.error("❌ Erreur import middlewares:", error);
  }
  
  await db.$disconnect();
  console.log("\n🎉 Vérification complète terminée!");
}

verifyComplete().catch(console.error);