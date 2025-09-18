import { NextRequest } from "next/server";

async function testAuthRoutes() {
  console.log("🧪 Test des routes d'authentification...\n");

  const baseUrl = "http://localhost:3000";
  
  try {
    // 1. Test de register
    console.log("1️⃣ Test POST /api/auth/register...");
    const registerData = {
      email: "user@test.dev",
      password: "test123456",
      nom_complet: "User Test",
      username: "usertest"
    };

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData)
    });

    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log(`✅ Register OK - User: ${registerResult.user.email} (${registerResult.user.role})`);
    } else {
      const error = await registerResponse.text();
      console.log(`⚠️ Register - ${registerResponse.status}: ${error}`);
    }

    // 2. Test de login
    console.log("\n2️⃣ Test POST /api/auth/login...");
    const loginData = {
      email: "admin@booky.dev",
      password: "test123"
    };

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    });

    let authCookie = "";
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log(`✅ Login OK - User: ${loginResult.user.email} (${loginResult.user.role})`);
      
      // Récupérer le cookie d'auth
      const setCookieHeader = loginResponse.headers.get("Set-Cookie");
      if (setCookieHeader) {
        authCookie = setCookieHeader;
        console.log(`✅ Auth cookie reçu`);
      }
    } else {
      const error = await loginResponse.text();
      console.log(`❌ Login failed - ${loginResponse.status}: ${error}`);
    }

    // 3. Test de session avec cookie
    if (authCookie) {
      console.log("\n3️⃣ Test GET /api/auth/session avec cookie...");
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        method: "GET",
        headers: { 
          "Cookie": authCookie
        }
      });

      if (sessionResponse.ok) {
        const sessionResult = await sessionResponse.json();
        console.log(`✅ Session OK - User: ${sessionResult.user.email} (${sessionResult.user.role})`);
      } else {
        const error = await sessionResponse.text();
        console.log(`❌ Session failed - ${sessionResponse.status}: ${error}`);
      }
    }

    // 4. Test de logout
    console.log("\n4️⃣ Test POST /api/auth/logout...");
    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { 
        "Cookie": authCookie
      }
    });

    if (logoutResponse.ok) {
      const logoutResult = await logoutResponse.json();
      console.log(`✅ Logout OK - ${logoutResult.message}`);
    } else {
      const error = await logoutResponse.text();
      console.log(`❌ Logout failed - ${logoutResponse.status}: ${error}`);
    }

    console.log("\n🎉 Tests des routes terminés !");

  } catch (error) {
    console.error("❌ Erreur lors des tests des routes:", error);
  }
}

// Démarrer le serveur et exécuter les tests
async function runTests() {
  console.log("Attendre 3 secondes pour que le serveur démarre...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testAuthRoutes();
  console.log("\n✅ Tests terminés");
}

runTests().catch(console.error);