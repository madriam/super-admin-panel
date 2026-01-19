// Ontology Service API Client

import type {
  Organization,
  OrganizationSummary,
  OrganizationCreate,
  OrganizationUpdate,
  Department,
  DepartmentCreate,
  DepartmentUpdate,
  Agent,
  AgentCreate,
  AgentUpdate,
  AIAgent,
  AIAgentCreate,
  AIAgentUpdate,
  Queue,
  QueueCreate,
  QueueUpdate,
  Integration,
  IntegrationCreate,
  IntegrationUpdate,
  IntegrationRoutingImpact,
  RoutingRule,
  RoutingRuleCreate,
  CanvasData,
  DelegationOption,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_ONTOLOGY_API_URL || 'http://localhost:8000';
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'tenant-a';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  tenantId: string = DEFAULT_TENANT
): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ========== Organizations ==========

export const organizationsApi = {
  list: (params?: { is_active?: boolean; plan?: string }) =>
    fetchApi<OrganizationSummary[]>(
      `/organizations${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      '' // No tenant for org-level operations
    ),

  get: (id: string) => fetchApi<Organization>(`/organizations/${id}`, {}, ''),

  getByTenant: (tenantId: string) =>
    fetchApi<Organization>(`/organizations/by-tenant/${tenantId}`, {}, ''),

  getBySlug: (slug: string) =>
    fetchApi<Organization>(`/organizations/by-slug/${slug}`, {}, ''),

  checkSlug: (slug: string) =>
    fetchApi<{ slug: string; available: boolean }>(
      `/organizations/check-slug/${slug}`,
      {},
      ''
    ),

  create: (data: OrganizationCreate) =>
    fetchApi<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }, ''),

  update: (id: string, data: OrganizationUpdate) =>
    fetchApi<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, ''),

  delete: (id: string) =>
    fetchApi<void>(`/organizations/${id}`, {
      method: 'DELETE',
    }, ''),

  getStats: (id: string) =>
    fetchApi<{
      department_count: number;
      agent_count: number;
      messages_used: number;
      messages_limit: number;
      messages_remaining: number;
      usage_percentage: number;
    }>(`/organizations/${id}/stats`, {}, ''),

  resetMessages: (id: string) =>
    fetchApi<Organization>(`/organizations/${id}/reset-messages`, {
      method: 'POST',
    }, ''),
};

// ========== Departments ==========

export const departmentsApi = {
  list: (tenantId: string, params?: { is_active?: boolean; parent_id?: string }) =>
    fetchApi<Department[]>(
      `/departments${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<Department>(`/departments/${id}`, {}, tenantId),

  create: (tenantId: string, data: DepartmentCreate) =>
    fetchApi<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  update: (tenantId: string, id: string, data: DepartmentUpdate) =>
    fetchApi<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/departments/${id}`, {
      method: 'DELETE',
    }, tenantId),

  getHierarchy: (tenantId: string, id: string) => fetchApi<Department>(`/departments/${id}/hierarchy`, {}, tenantId),

  getRoots: (tenantId: string) => fetchApi<Department[]>('/departments/roots', {}, tenantId),
};

// ========== Agents ==========

export const agentsApi = {
  list: (tenantId: string, params?: { department_id?: string; status_filter?: string; is_active?: boolean }) =>
    fetchApi<Agent[]>(
      `/agents${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<Agent>(`/agents/${id}`, {}, tenantId),

  getByExternalId: (tenantId: string, externalId: string) =>
    fetchApi<Agent>(`/agents/external/${externalId}`, {}, tenantId),

  getAvailable: (tenantId: string, params?: { department_id?: string; skills?: string }) =>
    fetchApi<Agent[]>(
      `/agents/available${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  create: (tenantId: string, data: AgentCreate) =>
    fetchApi<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  update: (tenantId: string, id: string, data: AgentUpdate) =>
    fetchApi<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, tenantId),

  updateStatus: (tenantId: string, id: string, status: string) =>
    fetchApi<Agent>(`/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/agents/${id}`, {
      method: 'DELETE',
    }, tenantId),
};

// ========== Queues ==========

export const queuesApi = {
  list: (tenantId: string, params?: { department_id?: string; is_active?: boolean }) =>
    fetchApi<Queue[]>(
      `/queues${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<Queue>(`/queues/${id}`, {}, tenantId),

  getDefault: (tenantId: string, departmentId: string) =>
    fetchApi<Queue>(`/queues/department/${departmentId}/default`, {}, tenantId),

  create: (tenantId: string, data: QueueCreate) =>
    fetchApi<Queue>('/queues', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  update: (tenantId: string, id: string, data: QueueUpdate) =>
    fetchApi<Queue>(`/queues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/queues/${id}`, {
      method: 'DELETE',
    }, tenantId),
};

// ========== AI Agents ==========

export const aiAgentsApi = {
  list: (tenantId: string, params?: { is_active?: boolean }) =>
    fetchApi<AIAgent[]>(
      `/ai-agents${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<AIAgent>(`/ai-agents/${id}`, {}, tenantId),

  getDefault: (tenantId: string) => fetchApi<AIAgent>('/ai-agents/default', {}, tenantId),

  create: (tenantId: string, data: AIAgentCreate) =>
    fetchApi<AIAgent>('/ai-agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  update: (tenantId: string, id: string, data: AIAgentUpdate) =>
    fetchApi<AIAgent>(`/ai-agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, tenantId),

  setDefault: (tenantId: string, id: string) =>
    fetchApi<AIAgent>(`/ai-agents/${id}/set-default`, {
      method: 'POST',
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/ai-agents/${id}`, {
      method: 'DELETE',
    }, tenantId),
};

// ========== Integrations ==========

export const integrationsApi = {
  list: (tenantId: string, params?: { type?: string; is_active?: boolean }) =>
    fetchApi<Integration[]>(
      `/integrations${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<Integration>(`/integrations/${id}`, {}, tenantId),

  create: (tenantId: string, data: IntegrationCreate) =>
    fetchApi<Integration>('/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  update: (tenantId: string, id: string, data: IntegrationUpdate) =>
    fetchApi<Integration>(`/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/integrations/${id}`, {
      method: 'DELETE',
    }, tenantId),

  getRoutingImpact: (tenantId: string, id: string) =>
    fetchApi<IntegrationRoutingImpact>(`/integrations/${id}/routing-impact`, {}, tenantId),

  disable: (tenantId: string, id: string, confirm: boolean = false) =>
    fetchApi<Integration>(`/integrations/${id}/disable?confirm=${confirm}`, {
      method: 'POST',
    }, tenantId),
};

// ========== Routing Rules ==========

export const routingApi = {
  list: (tenantId: string, params?: { source_type?: string; source_id?: string; is_active?: boolean }) =>
    fetchApi<RoutingRule[]>(
      `/routing-rules${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  get: (tenantId: string, id: string) => fetchApi<RoutingRule>(`/routing-rules/${id}`, {}, tenantId),

  create: (tenantId: string, data: RoutingRuleCreate) =>
    fetchApi<RoutingRule>('/routing-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }, tenantId),

  delete: (tenantId: string, id: string) =>
    fetchApi<void>(`/routing-rules/${id}`, {
      method: 'DELETE',
    }, tenantId),

  // Canvas endpoints
  getCanvasData: (tenantId: string) => fetchApi<CanvasData>('/routing-rules/ontology/canvas', {}, tenantId),

  savePositions: (tenantId: string, positions: Array<{
    node_type: string;
    node_id?: string;
    position_x: number;
    position_y: number;
  }>) =>
    fetchApi<unknown>('/routing-rules/ontology/positions', {
      method: 'PUT',
      body: JSON.stringify({ positions }),
    }, tenantId),
};

// ========== Delegation ==========

export const delegationApi = {
  getOptions: (tenantId: string, params?: { source_type?: string; source_id?: string }) =>
    fetchApi<DelegationOption[]>(
      `/delegation/options${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`,
      {},
      tenantId
    ),

  getOptionsForAgent: (tenantId: string, agentId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-agent/${agentId}`, {}, tenantId),

  getOptionsForDepartment: (tenantId: string, departmentId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-department/${departmentId}`, {}, tenantId),

  getOptionsForQueue: (tenantId: string, queueId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-queue/${queueId}`, {}, tenantId),
};
