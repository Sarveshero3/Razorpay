const BASE_URL = import.meta.env.VITE_API_URL || "";

type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export interface ApiError {
  status: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export const api = {
  // Registers global interceptor hook for 401 Unauthorized errors
  onUnauthorized(cb: UnauthorizedHandler) {
    onUnauthorizedCallback = cb;
  },

  // Perform fetch execution
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      credentials: "include", // Critical flag: sends and stores cookie JWT automatically
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        throw new Error("Unauthorized");
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorObj: ApiError = {
          status: response.status,
          message: data.message || "An unexpected error occurred",
          errors: data.errors,
        };
        throw errorObj;
      }

      return data;
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        throw error;
      }
      throw error;
    }
  },

  get<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body: any = null, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body: any = null, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, body: any = null, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
