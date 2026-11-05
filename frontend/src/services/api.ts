import {
  DashboardMetricsResponse,
  TransactionListResponse,
  Transaction,
  PayPalConfig,
  OrderItem,
  Product,
  AiChatResponse,
  RecommendationsResponse,
  MerchantProfile
} from '../types';

/**
 * Intelligently resolves the API Base URL with multi-tiered production resilience:
 * 1. Build-time or runtime environment variable (VITE_API_BASE_URL) if defined.
 * 2. If running in a production browser environment:
 *    - If loaded on the backend domain itself (unified deployment): returns relative '/api'.
 *    - If loaded on a separate Render Static Site and VITE_API_BASE_URL was omitted at build time:
 *      automatically routes to the live backend 'https://merchant-growth-ai-dashboard.onrender.com/api'.
 * 3. In local development (localhost / 127.0.0.1): returns '/api' (handled by Vite dev server proxy).
 */
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

    if (!isLocalhost) {
      if (origin === 'https://merchant-growth-ai-dashboard.onrender.com') {
        return '/api';
      }
      return 'https://merchant-growth-ai-dashboard.onrender.com/api';
    }
  }

  return '/api';
};

const API_BASE = getApiBaseUrl();

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. The cloud backend may be waking up from sleep (Render free tier). Please wait a moment and retry.`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  getBaseUrl() {
    return API_BASE;
  },

  async getHealth() {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 35000);
    if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
    return res.json();
  },

  async getMetricsSummary(days: number = 30): Promise<DashboardMetricsResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/summary?days=${days}`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch metrics summary');
    return res.json();
  },

  async getMerchantProfile(): Promise<MerchantProfile> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/profile`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateMerchantProfile(profile: Partial<MerchantProfile>): Promise<MerchantProfile> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }, 30000);
    if (!res.ok) throw new Error('Failed to update merchant profile');
    return res.json();
  },

  async resetDemoData(): Promise<{ message: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/reset-demo`, { method: 'POST' }, 30000);
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  },

  async clearDemoData(): Promise<{ message: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/clear-demo`, { method: 'POST' }, 30000);
    if (!res.ok) throw new Error('Failed to clear demo data');
    return res.json();
  },

  async getTransactions(
    page: number = 1,
    pageSize: number = 15,
    status?: string,
    query?: string
  ): Promise<TransactionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (status && status !== 'ALL') params.append('status', status);
    if (query && query.trim()) params.append('query', query.trim());

    const res = await fetchWithTimeout(`${API_BASE}/transactions?${params.toString()}`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getTransaction(id: string): Promise<Transaction> {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/${id}`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch transaction details');
    return res.json();
  },

  async refundTransaction(id: string, reason: string, amount?: number): Promise<Transaction> {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, amount }),
    }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to refund transaction');
    }
    return res.json();
  },

  async getPayPalConfig(): Promise<PayPalConfig> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/config`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch PayPal config');
    return res.json();
  },

  async createPayPalOrder(
    items: OrderItem[],
    customerName?: string,
    customerEmail?: string,
    isSample: boolean = false
  ): Promise<{ order_id: string; status: string; approval_url?: string; amount: number; currency: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        currency: 'USD',
        customer_name: customerName,
        customer_email: customerEmail,
        is_sample: isSample,
      }),
    }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create PayPal order');
    }
    return res.json();
  },

  async capturePayPalOrder(
    orderId: string,
    items?: OrderItem[],
    customerName?: string,
    customerEmail?: string
  ) {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        items,
        customer_name: customerName,
        customer_email: customerEmail,
      }),
    }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to capture PayPal order');
    }
    return res.json();
  },

  async getPayPalOrderStatus(orderId: string): Promise<{ order_id: string; status: string; intent?: string; payer?: any }> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/orders/${orderId}`, {}, 15000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to check order status');
    }
    return res.json();
  },

  async cancelPayPalOrder(orderId: string, reason?: string): Promise<{ success: boolean; status: string; order_id: string; message: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/cancel-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, reason }),
    }, 15000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to cancel order');
    }
    return res.json();
  },

  async chatWithAgent(message: string, history: { role: string; content: string }[] = []): Promise<AiChatResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to get AI response');
    }
    return res.json();
  },

  async getRecommendations(): Promise<RecommendationsResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/recommendations`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/products`, {}, 30000);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },
};
