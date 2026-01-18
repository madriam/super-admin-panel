// Ontology Service Types

// Organization Types
export type OrganizationPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise';

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  tax_id: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  plan: OrganizationPlan;
  messages_limit: number;
  messages_used: number;
  messages_remaining: number;
  usage_percentage: number;
  billing_email: string | null;
  is_active: boolean;
  is_verified: boolean;
  sso_enabled: boolean;
  sso_provider: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  department_count: number;
  agent_count: number;
}

export interface OrganizationSummary {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  is_active: boolean;
  messages_used: number;
  messages_limit: number;
  created_at: string;
}

export interface OrganizationCreate {
  name: string;
  slug: string;
  tenant_id?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postal_code?: string | null;
  tax_id?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  plan?: OrganizationPlan;
  messages_limit?: number;
  billing_email?: string | null;
  metadata?: Record<string, unknown>;
}

export interface OrganizationUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postal_code?: string | null;
  tax_id?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  plan?: OrganizationPlan;
  messages_limit?: number;
  billing_email?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  sso_enabled?: boolean;
  sso_provider?: string | null;
  sso_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_department_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  agent_count: number;
  queue_count: number;
}

export interface DepartmentCreate {
  name: string;
  description?: string | null;
  parent_department_id?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DepartmentUpdate {
  name?: string;
  description?: string | null;
  parent_department_id?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export type AgentStatus = 'online' | 'offline' | 'busy' | 'away';

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  department_id: string | null;
  external_id: string | null;
  status: AgentStatus;
  skills: string[];
  max_concurrent_chats: number;
  current_chat_count: number;
  is_active: boolean;
  is_available: boolean;
  department_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  email?: string | null;
  department_id?: string | null;
  external_id?: string | null;
  skills?: string[];
  max_concurrent_chats?: number;
  is_active?: boolean;
}

export interface AgentUpdate {
  name?: string;
  email?: string | null;
  department_id?: string | null;
  external_id?: string | null;
  skills?: string[];
  max_concurrent_chats?: number;
  is_active?: boolean;
}

export type RoutingStrategy = 'round_robin' | 'least_busy' | 'skill_based';

export interface Queue {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  priority: number;
  is_default: boolean;
  routing_strategy: RoutingStrategy;
  is_active: boolean;
  pending_count: number;
  department_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueCreate {
  name: string;
  description?: string | null;
  department_id?: string | null;
  priority?: number;
  is_default?: boolean;
  routing_strategy?: RoutingStrategy;
  is_active?: boolean;
}

export interface QueueUpdate {
  name?: string;
  description?: string | null;
  department_id?: string | null;
  priority?: number;
  is_default?: boolean;
  routing_strategy?: RoutingStrategy;
  is_active?: boolean;
}

// AI Agent Types
export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-5-haiku';

export interface AIAgent {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  model: AIModel;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  auto_handoff: boolean;
  max_messages_before_handoff: number;
  handoff_keywords: string[];
  confidence_threshold: number;
  is_active: boolean;
  is_default: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AIAgentCreate {
  name: string;
  description?: string | null;
  model?: AIModel;
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  auto_handoff?: boolean;
  max_messages_before_handoff?: number;
  handoff_keywords?: string[];
  confidence_threshold?: number;
  is_active?: boolean;
  is_default?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIAgentUpdate {
  name?: string;
  description?: string | null;
  model?: AIModel;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  auto_handoff?: boolean;
  max_messages_before_handoff?: number;
  handoff_keywords?: string[];
  confidence_threshold?: number;
  is_active?: boolean;
  is_default?: boolean;
  metadata?: Record<string, unknown>;
}

// Routing Types
// client = entry point for conversations (WhatsApp, etc.)
// ai_agent = AI assistant
// department = organizational unit
// queue = waiting queue within department
// agent = human attendant
export type SourceType = 'client' | 'ai_agent' | 'department' | 'agent' | 'queue';
export type DestinationType = 'ai_agent' | 'department' | 'queue' | 'agent';
export type NodeType = 'client' | 'ai_agent' | 'department' | 'queue' | 'agent';

export interface RoutingRule {
  id: string;
  tenant_id: string;
  source_type: SourceType;
  source_id: string | null;
  destination_type: DestinationType;
  destination_id: string;
  priority: number;
  conditions: Record<string, unknown>;
  is_active: boolean;
  destination_name?: string;
  created_at: string;
  updated_at: string;
}

export interface RoutingRuleCreate {
  source_type: SourceType;
  source_id?: string | null;
  destination_type: DestinationType;
  destination_id: string;
  priority?: number;
  conditions?: Record<string, unknown>;
  is_active?: boolean;
}

export interface DelegationOption {
  destination_type: DestinationType;
  destination_id: string;
  destination_name: string;
  queue_size: number | null;  // Only for queues
  agent_status: string | null;  // Only for agents
  is_available: boolean;
}

// Response from /delegation/routing-path
export interface RoutingPath {
  current: {
    type: SourceType;
    id: string | null;
  };
  options: DelegationOption[];
  can_return_to_ai: boolean;
}

// React Flow Canvas Types
export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    id?: string;
    // Client node
    isEntryPoint?: boolean;
    // AI Agent node
    isDefault?: boolean;
    model?: string;
    // Department node
    agentCount?: number;
    queueCount?: number;
    // Queue node
    pendingCount?: number;
    // Agent node
    status?: string;
    isAvailable?: boolean;
    departmentId?: string;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  data: {
    ruleId: string;
    priority: number;
    conditions: Record<string, unknown>;
  };
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
