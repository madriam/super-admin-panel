'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  HelpCircle,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  lastCheck: Date;
  details?: string;
}

interface ApiServiceStatus {
  name: string;
  status: 'ok' | 'error' | 'unknown';
  latency?: number;
  lastChecked: string;
}

interface ApiResponse {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ApiServiceStatus[];
  summary: {
    ok: number;
    error: number;
    unknown: number;
    total: number;
  };
  checkedAt: string;
}

// Map API status to display status
const mapApiStatus = (status: ApiServiceStatus['status']): ServiceStatus['status'] => {
  switch (status) {
    case 'ok':
      return 'healthy';
    case 'error':
      return 'down';
    case 'unknown':
      return 'unknown';
    default:
      return 'unknown';
  }
};

// Generate details based on status and latency
const generateDetails = (service: ApiServiceStatus): string => {
  if (service.status === 'ok') {
    if (service.latency !== undefined) {
      if (service.latency < 100) return 'Respondendo normalmente';
      if (service.latency < 500) return 'Latencia moderada';
      return 'Latencia alta';
    }
    return 'Operacional';
  }
  if (service.status === 'error') {
    return 'Servico indisponivel';
  }
  return 'Status nao verificavel (interno)';
};

const getStatusIcon = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'unknown':
      return <HelpCircle className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusColor = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'degraded':
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'down':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'unknown':
      return 'bg-gray-50 border-gray-200 text-gray-600';
  }
};

const getStatusLabel = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'healthy':
      return 'Saudavel';
    case 'degraded':
      return 'Degradado';
    case 'down':
      return 'Fora do ar';
    case 'unknown':
      return 'Desconhecido';
  }
};

export default function SystemHealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceStatus = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/services/status');
      if (!response.ok) {
        throw new Error('Falha ao buscar status dos servicos');
      }

      const data: ApiResponse = await response.json();

      // Transform API response to component format
      const transformedServices: ServiceStatus[] = data.services.map((service) => ({
        name: service.name,
        status: mapApiStatus(service.status),
        latency: service.latency,
        lastCheck: new Date(service.lastChecked),
        details: generateDetails(service),
      }));

      setServices(transformedServices);
      setLastRefresh(new Date(data.checkedAt));
    } catch (err) {
      console.error('Error fetching service status:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServiceStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchServiceStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => fetchServiceStatus(true);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;
  const unknownCount = services.filter((s) => s.status === 'unknown').length;

  const overallStatus =
    downCount > 0 ? 'critical' : degradedCount > 0 ? 'warning' : 'operational';

  // Calculate average latency from services that have latency data
  const servicesWithLatency = services.filter((s) => s.latency !== undefined);
  const avgLatency =
    servicesWithLatency.length > 0
      ? Math.round(
          servicesWithLatency.reduce((sum, s) => sum + (s.latency || 0), 0) /
            servicesWithLatency.length
        )
      : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-500">Verificando status dos servicos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-2 text-gray-900 font-medium">Erro ao carregar status</p>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => fetchServiceStatus(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saude do Sistema</h1>
          <p className="mt-1 text-sm text-gray-500">
            Status dos servicos e infraestrutura da plataforma
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </button>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`rounded-xl p-6 mb-8 ${
          overallStatus === 'operational'
            ? 'bg-green-50 border border-green-200'
            : overallStatus === 'warning'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                overallStatus === 'operational'
                  ? 'bg-green-100'
                  : overallStatus === 'warning'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              <Activity
                className={`h-8 w-8 ${
                  overallStatus === 'operational'
                    ? 'text-green-600'
                    : overallStatus === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              />
            </div>
            <div>
              <h2
                className={`text-xl font-semibold ${
                  overallStatus === 'operational'
                    ? 'text-green-800'
                    : overallStatus === 'warning'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}
              >
                {overallStatus === 'operational'
                  ? 'Todos os sistemas operacionais'
                  : overallStatus === 'warning'
                  ? 'Alguns servicos com degradacao'
                  : 'Servicos criticos fora do ar'}
              </h2>
              <p className="text-sm mt-1 opacity-75">
                Ultima verificacao: {lastRefresh ? lastRefresh.toLocaleTimeString('pt-BR') : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              <p className="text-sm text-gray-600">Saudaveis</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{unknownCount}</p>
              <p className="text-sm text-gray-600">Internos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{downCount}</p>
              <p className="text-sm text-gray-600">Fora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Servicos</p>
              <p className="text-xl font-semibold text-gray-900">
                {healthyCount} / {services.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verificaveis</p>
              <p className="text-xl font-semibold text-gray-900">
                {services.length - unknownCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Com Problemas</p>
              <p className="text-xl font-semibold text-gray-900">{downCount + degradedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wifi className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Latencia Media</p>
              <p className="text-xl font-semibold text-gray-900">
                {avgLatency !== null ? `${avgLatency}ms` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Status dos Servicos</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Medindo latencias...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Recalcular Latencias
              </>
            )}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {services.map((service) => (
            <div
              key={service.name}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                refreshing ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.details}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {service.latency !== undefined && (
                  <div className="text-right">
                    <p className={`text-sm font-medium text-gray-900 ${refreshing ? 'animate-pulse' : ''}`}>
                      {refreshing ? '...' : `${service.latency}ms`}
                    </p>
                    <p className="text-xs text-gray-500">latencia</p>
                  </div>
                )}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    service.status
                  )}`}
                >
                  {getStatusLabel(service.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Infraestrutura</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider</span>
              <span className="font-medium text-gray-900">Hetzner Cloud</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Regiao</span>
              <span className="font-medium text-gray-900">Helsinki (eu-central)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cluster</span>
              <span className="font-medium text-gray-900">K3s v1.28.5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GitOps</span>
              <span className="font-medium text-gray-900">ArgoCD</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Dados</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="font-medium text-gray-900">PostgreSQL 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Streaming</span>
              <span className="font-medium text-gray-900">Redpanda</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cache</span>
              <span className="font-medium text-gray-900">Redis 7</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Backup</span>
              <span className="font-medium text-gray-900">Velero (Semanal)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
