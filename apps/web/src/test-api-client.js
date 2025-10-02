/**
 * Script de test pour valider le nouveau client API
 * À exécuter avec: node test-api-client.js
 */

// Import du client API (simulation pour test Node.js)
const fetch = require('node-fetch'); // Si disponible
global.fetch = global.fetch || fetch;

// Configuration de base
const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

/**
 * Classe ApiClient simplifiée pour test
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  buildUrl(endpoint, params) {
    const url = `${this.baseUrl}${endpoint}`;
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  async request(endpoint, options = {}) {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const defaultOptions = {
      credentials: `include`,
      headers: {
        `Content-Type': 'application/json',
      },
    };

    const finalOptions = {
      ...defaultOptions,
      ...fetchOptions,
      headers: {
        ...defaultOptions.headers,
        ...fetchOptions.headers,
      },
    };

    try {
      console.log(`[API TEST] ${finalOptions.method || `GET'} ${url}');

      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'HTTP ${response.status}: ${response.statusText}` };
        }

        console.error(`[API TEST Error] ${response.status}:`, errorData);
        return {
          success: false,
          error: errorData.error || errorData.message || `HTTP ${response.status}`,
          data: undefined
        };
      }

      const data = await response.json();
      console.log(`[API TEST Success] ${url}:`, data);

      if (typeof data === `object` && `success` in data) {
        return data;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error(`[API TEST Network Error] ${url}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async get(endpoint, params) {
    return this.request(endpoint, { method: `GET', params });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

/**
 * Tests du client API
 */
async function testApiClient() {
  const client = new ApiClient();

  console.log('🧪 Test du client API - Démarrage');
  console.log('📍 Base URL: ${client.baseUrl}`);
  console.log(``);

  // Test 1: Health check
  console.log(`📋 Test 1: Health check');
  try {
    const healthResponse = await client.get('/api/health');
    if (healthResponse.success) {
      console.log('✅ Health check réussi');
    } else {
      console.log('❌ Health check échoué:', healthResponse.error);
    }
  } catch (error) {
    console.log('💥 Erreur lors du health check:', error.message);
  }
  console.log('');

  // Test 2: Books API
  console.log('📚 Test 2: Books API');
  try {
    const booksResponse = await client.get('/api/books', { limit: 3 });
    if (booksResponse.success) {
      console.log(`✅ Books API réussi - ${booksResponse.data?.data?.length || 0} livres récupérés`);
    } else {
      console.log('❌ Books API échoué:`, booksResponse.error);
    }
  } catch (error) {
    console.log(`💥 Erreur lors du test books:', error.message);
  }
  console.log('');

  // Test 3: Favorites API (probablement échouera sans auth)
  console.log('❤️ Test 3: Favorites API (sans auth - devrait échouer)');
  try {
    const favoritesResponse = await client.get('/api/favorites');
    if (favoritesResponse.success) {
      console.log('✅ Favorites API réussi (inattendu sans auth)');
    } else {
      console.log('❌ Favorites API échoué comme attendu:', favoritesResponse.error);
    }
  } catch (error) {
    console.log('💥 Erreur lors du test favorites:', error.message);
  }
  console.log('');

  console.log('🎯 Tests terminés !');
}

// Exécuter les tests
testApiClient().catch(console.error);