// =====================================================
// Types para o SysHub AI Frontend
// =====================================================

// User & Auth
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user' | 'viewer';
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Systems
export type SystemStatus = 'online' | 'teste' | 'depreciado' | 'offline';
export type SystemCategory = 'Estoque' | 'Financeiro' | 'ERP Fábrica' | 'Calculadoras' | 'Integração' | 'Outro';

export interface System {
  id: string;
  name: string;
  slug: string;
  category: SystemCategory;
  status: SystemStatus;
  description: string;
  icon?: string;
  version?: string;
  databaseConnection?: Record<string, any>;
  apiEndpoint?: string;
  documentationUrl?: string;
  contactEmail?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  totalQueries: number;
  completedQueries: number;
  failedQueries: number;
  avgExecutionTime: number;
  lastQueryAt?: string;
}

// Queries
export type QueryStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Query {
  id: string;
  userId: string;
  question: string;
  systemId?: string;
  systemName?: string;
  systemNameFull?: string;
  systemIcon?: string;
  response?: string;
  responseMetadata?: Record<string, any>;
  status: QueryStatus;
  errorMessage?: string;
  executionTimeMs?: number;
  tokensUsed?: number;
  isFavorite: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface QueryStats {
  totalQueries: number;
  completedQueries: number;
  failedQueries: number;
  favoriteQueries: number;
  avgExecutionTime: number;
  totalTokens: number;
}

// Conversations
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  systemId?: string;
  systemName?: string;
  systemIcon?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: ConversationMessage[];
}

// User Profile & Activity
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserStats {
  totalQueries: number;
  completedQueries: number;
  favoriteQueries: number;
  totalConversations: number;
  avgExecutionTime: number;
  totalTokensUsed: number;
}

export type ActivityType = 'query' | 'conversation';

export interface UserActivity {
  type: ActivityType;
  id: string;
  title: string;
  createdAt: string;
  systemName?: string;
}

// Notifications
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// API Responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
  status?: number;
}

// N8N Webhook
export interface N8NWebhookPayload {
  user_question: string;
  available_systems: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
    description: string;
  }>;
  conversation_history: Array<{
    role: string;
    content: string;
  }>;
  metadata: {
    source: string;
    ui_version: string;
  };
}

export interface N8NWebhookResponse {
  answer: string;
  system_used: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

// History Items (para componente QueryHistory)
export interface HistoryItem {
  id: string;
  systemName: string;
  question: string;
  summary: string;
  timestamp: Date;
  isFavorite: boolean;
}

// Agent Response (para componente ResponseCarousel)
export interface AgentResponse {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  systemName: string;
}
