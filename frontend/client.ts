// src/lib/api/client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private apiPrefix: string;
  private defaultTimeout: number = 30000;

  constructor(baseUrl: string = API_BASE_URL, apiPrefix: string = API_PREFIX) {
    this.baseUrl = baseUrl;
    this.apiPrefix = apiPrefix;
  }

  private async fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: object,
    options: FetchOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${this.apiPrefix}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const fetchOptions: FetchOptions = {
      ...options,
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `API Error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API Request Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${this.apiPrefix}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return this.request<T>(endpoint + (params ? `?${url.searchParams.toString()}` : ""), "GET");
  }

  async post<T>(endpoint: string, body: object): Promise<T> {
    return this.request<T>(endpoint, "POST", body);
  }

  async put<T>(endpoint: string, body: object): Promise<T> {
    return this.request<T>(endpoint, "PUT", body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, "DELETE");
  }
}

export const apiClient = new ApiClient();
