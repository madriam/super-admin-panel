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
    'X-Tenant-ID': tenantId,
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
  list: (params?: { is_active?: boolean; parent_id?: string }) =>
    fetchApi<Department[]>(
      `/departments${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  get: (id: string) => fetchApi<Department>(`/departments/${id}`),

  create: (data: DepartmentCreate) =>
    fetchApi<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: DepartmentUpdate) =>
    fetchApi<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/departments/${id}`, {
      method: 'DELETE',
    }),

  getHierarchy: (id: string) => fetchApi<Department>(`/departments/${id}/hierarchy`),

  getRoots: () => fetchApi<Department[]>('/departments/roots'),
};

// ========== Agents ==========

export const agentsApi = {
  list: (params?: { department_id?: string; status_filter?: string; is_active?: boolean }) =>
    fetchApi<Agent[]>(
      `/agents${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  get: (id: string) => fetchApi<Agent>(`/agents/${id}`),

  getByExternalId: (externalId: string) =>
    fetchApi<Agent>(`/agents/external/${externalId}`),

  getAvailable: (params?: { department_id?: string; skills?: string }) =>
    fetchApi<Agent[]>(
      `/agents/available${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  create: (data: AgentCreate) =>
    fetchApi<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: AgentUpdate) =>
    fetchApi<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Agent>(`/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/agents/${id}`, {
      method: 'DELETE',
    }),
};

// ========== Queues ==========

export const queuesApi = {
  list: (params?: { department_id?: string; is_active?: boolean }) =>
    fetchApi<Queue[]>(
      `/queues${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  get: (id: string) => fetchApi<Queue>(`/queues/${id}`),

  getDefault: (departmentId: string) =>
    fetchApi<Queue>(`/queues/department/${departmentId}/default`),

  create: (data: QueueCreate) =>
    fetchApi<Queue>('/queues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: QueueUpdate) =>
    fetchApi<Queue>(`/queues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/queues/${id}`, {
      method: 'DELETE',
    }),
};

// ========== AI Agents ==========

export const aiAgentsApi = {
  list: (params?: { is_active?: boolean }) =>
    fetchApi<AIAgent[]>(
      `/ai-agents${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  get: (id: string) => fetchApi<AIAgent>(`/ai-agents/${id}`),

  getDefault: () => fetchApi<AIAgent>('/ai-agents/default'),

  create: (data: AIAgentCreate) =>
    fetchApi<AIAgent>('/ai-agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: AIAgentUpdate) =>
    fetchApi<AIAgent>(`/ai-agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  setDefault: (id: string) =>
    fetchApi<AIAgent>(`/ai-agents/${id}/set-default`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    fetchApi<void>(`/ai-agents/${id}`, {
      method: 'DELETE',
    }),
};

// ========== Routing Rules ==========

export const routingApi = {
  list: (params?: { source_type?: string; source_id?: string; is_active?: boolean }) =>
    fetchApi<RoutingRule[]>(
      `/routing-rules${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  get: (id: string) => fetchApi<RoutingRule>(`/routing-rules/${id}`),

  create: (data: RoutingRuleCreate) =>
    fetchApi<RoutingRule>('/routing-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/routing-rules/${id}`, {
      method: 'DELETE',
    }),

  // Canvas endpoints
  getCanvasData: () => fetchApi<CanvasData>('/routing-rules/ontology/canvas'),

  savePositions: (positions: Array<{
    node_type: string;
    node_id?: string;
    position_x: number;
    position_y: number;
  }>) =>
    fetchApi<unknown>('/routing-rules/ontology/positions', {
      method: 'PUT',
      body: JSON.stringify({ positions }),
    }),
};

// ========== Delegation ==========

export const delegationApi = {
  getOptions: (params?: { source_type?: string; source_id?: string }) =>
    fetchApi<DelegationOption[]>(
      `/delegation/options${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
    ),

  getOptionsForAgent: (agentId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-agent/${agentId}`),

  getOptionsForDepartment: (departmentId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-department/${departmentId}`),

  getOptionsForQueue: (queueId: string) =>
    fetchApi<DelegationOption[]>(`/delegation/options/for-queue/${queueId}`),
};
