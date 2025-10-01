/**
 * Client API centralisé pour remplacer les appels proxy
 * Gère automatiquement l'authentification via les cookies
 */

interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // En développement, utilise localhost:3000 par défaut
    this.baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
  }

  /**
   * Construit l'URL complète avec les paramètres de requête
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = '${this.baseUrl}${endpoint}';

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
    return queryString ? '${url}?${queryString}' : url;
  }

  /**
   * Méthode générique pour les requêtes HTTP
   */
  private async request<T = any>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;

    const url = this.buildUrl(endpoint, params);

    const defaultOptions: RequestInit = {
      credentials: 'include', // Inclut automatiquement les cookies d'auth
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalOptions: RequestInit = {
      ...defaultOptions,
      ...fetchOptions,
      headers: {
        ...defaultOptions.headers,
        ...fetchOptions.headers,
      },
    };

    try {
      console.log(`[API] ${finalOptions.method || 'GET'} ${url}');

      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'HTTP ${response.status}: ${response.statusText}' };
        }

        console.error('[API Error] ${response.status}:', errorData);

        // Retourne une réponse d'erreur standardisée
        return {
          success: false,
          error: errorData.error || errorData.message || 'HTTP ${response.status}',
          data: undefined
        };
      }

      const data = await response.json();
      console.log(`[API Success] ${url}:`, data);

      // Si la réponse a déjà le format attendu
      if (typeof data === 'object' && 'success' in data) {
        return data;
      }

      // Sinon, l'encapsuler
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('[API Network Error] ${url}:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de réseau'
      };
    }
  }

  // ===== MÉTHODES PUBLIQUES =====

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Types utiles pour les réponses API
export type { ApiResponse, ApiClientOptions };

// Export de la classe pour les cas d'usage avancés
export { ApiClient };