async function testAuthHTTP() {
  console.log("🧪 Testing Better Auth HTTP endpoints...\n");
  
  try {
    const baseURL = "http://localhost:3000";
    
    // Test 1: Login via HTTP
    console.log("1️⃣ Testing login endpoint...");
    
    const loginResponse = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "bruna@booky.dev",
        password: "admin123"
      })
    });

    console.log("Login response status:", loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log("✅ Login successful!");
      console.log("Response:", loginData);
      
      // Récupérer les cookies de session
      const cookies = loginResponse.headers.get('set-cookie');
      console.log("Cookies:", cookies);
      
      // Test 2: Session check
      console.log("\n2️⃣ Testing session endpoint...");
      
      const sessionResponse = await fetch(`${baseURL}/api/auth/get-session`, {
        method: "GET",
        headers: {
          "Cookie": cookies || ""
        }
      });
      
      console.log("Session response status:", sessionResponse.status);
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log("✅ Session check successful!");
        console.log("Session data:", sessionData);
      } else {
        const errorData = await sessionResponse.text();
        console.log("❌ Session check failed:", errorData);
      }
      
    } else {
      const errorData = await loginResponse.text();
      console.log("❌ Login failed:", errorData);
    }
    
    console.log("\n🎉 HTTP tests completed!");
    
  } catch (error) {
    console.error("❌ HTTP test error:", error);
  }
}

testAuthHTTP();