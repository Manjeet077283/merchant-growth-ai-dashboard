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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
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
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Ensure FastAPI backend is running at https://merchant-growth-ai-dashboard.onrender.com`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  async getHealth() {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 8000);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async getMetricsSummary(days: number = 30): Promise<DashboardMetricsResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/summary?days=${days}`, {}, 10000);
    if (!res.ok) throw new Error('Failed to fetch metrics summary');
    return res.json();
  },

  async getMerchantProfile(): Promise<MerchantProfile> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/profile`, {}, 8000);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async resetDemoData(): Promise<{ message: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/metrics/reset-demo`, { method: 'POST' }, 10000);
    if (!res.ok) throw new Error('Failed to reset demo data');
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

    const res = await fetchWithTimeout(`${API_BASE}/transactions?${params.toString()}`, {}, 10000);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getTransaction(id: string): Promise<Transaction> {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/${id}`, {}, 8000);
    if (!res.ok) throw new Error('Failed to fetch transaction details');
    return res.json();
  },

  async refundTransaction(id: string, reason: string, amount?: number): Promise<Transaction> {
    const res = await fetchWithTimeout(`${API_BASE}/transactions/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, amount }),
    }, 12000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to refund transaction');
    }
    return res.json();
  },

  async getPayPalConfig(): Promise<PayPalConfig> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/config`, {}, 8000);
    if (!res.ok) throw new Error('Failed to fetch PayPal config');
    return res.json();
  },

  async createPayPalOrder(
    items: OrderItem[],
    customerName?: string,
    customerEmail?: string
  ): Promise<{ order_id: string; status: string; approval_url?: string; amount: number; currency: string }> {
    const res = await fetchWithTimeout(`${API_BASE}/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        currency: 'USD',
        customer_name: customerName,
        customer_email: customerEmail,
      }),
    }, 12000);
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
    }, 15000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to capture PayPal order');
    }
    return res.json();
  },

  async chatWithAgent(message: string, history: { role: string; content: string }[] = []): Promise<AiChatResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    }, 15000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to get AI response');
    }
    return res.json();
  },

  async getRecommendations(): Promise<RecommendationsResponse> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/recommendations`, {}, 10000);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetchWithTimeout(`${API_BASE}/ai/products`, {}, 8000);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },
};
