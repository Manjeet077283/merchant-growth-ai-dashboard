export interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  unit_price: number;
  category?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  inventory: number;
  description?: string;
  image_url?: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  fee: number;
  net_amount: number;
  payment_method: string;
  items: OrderItem[];
  refunded_amount?: number;
  refund_reason?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  transactions: Transaction[];
}

export interface KpiSummary {
  gross_sales: number;
  captured_payments: number;
  order_count: number;
  captured_order_count: number;
  average_order_value: number;
  refunds_total: number;
  refund_rate_pct: number;
  net_revenue: number;
  estimated_fees: number;
  sales_growth_pct: number;
  order_growth_pct: number;
  aov_growth_pct: number;
  refund_change_pct: number;
}

export interface RevenueTrendPoint {
  date: string;
  display_date: string;
  revenue: number;
  captured_revenue: number;
  orders_count: number;
  refunds: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  orders_count: number;
  percentage: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface HourlyTrendPoint {
  hour: number;
  display_hour: string;
  orders_count: number;
  revenue: number;
}

export interface DashboardMetricsResponse {
  kpis: KpiSummary;
  revenue_trends: RevenueTrendPoint[];
  category_breakdown: CategoryBreakdown[];
  status_breakdown: StatusBreakdown[];
  hourly_trends: HourlyTrendPoint[];
  recent_transactions: Transaction[];
}

export interface PayPalConfig {
  client_id_configured: boolean;
  client_id?: string;
  mode: string;
  currency: string;
  is_simulator: boolean;
}

export interface GroundedCitation {
  metric: string;
  value: string;
  context: string;
}

export interface ActionItem {
  title: string;
  impact: string;
  action: string;
}

export interface AiChatResponse {
  reply: string;
  model: string;
  citations: GroundedCitation[];
  suggested_actions: ActionItem[];
  suggested_questions: string[];
}

export interface RecommendationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  impact_estimate: string;
  impact_level: 'High' | 'Medium' | 'Low';
  effort_level: 'Quick Win' | 'Moderate' | 'Strategic';
  confidence_score: number;
  metric_evidence: string;
  action_cta: string;
}

export interface RecommendationsResponse {
  overall_health_score: number;
  summary: string;
  recommendations: RecommendationItem[];
}

export interface MerchantProfile {
  business_name: string;
  owner_name: string;
  category: string;
  currency: string;
  monthly_target: number;
  paypal_email: string;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
  demo_mode: boolean;
  database_type?: string;
  paypal_configured: boolean;
  paypal_mode: string;
  gemini_configured: boolean;
  gemini_model: string;
}

