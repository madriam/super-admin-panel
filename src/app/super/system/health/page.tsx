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
  Clock,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastCheck: Date;
  details?: string;
}

const SERVICES: ServiceStatus[] = [
  {
    name: 'API Gateway',
    status: 'healthy',
    latency: 45,
    lastCheck: new Date(),
    details: 'All endpoints responding normally',
  },
  {
    name: 'PostgreSQL',
    status: 'healthy',
    latency: 12,
    lastCheck: new Date(),
    details: 'Primary and replicas healthy',
  },
  {
    name: 'Redis Cache',
    status: 'healthy',
    latency: 3,
    lastCheck: new Date(),
    details: 'Memory usage at 45%',
  },
  {
    name: 'Redpanda (Kafka)',
    status: 'healthy',
    latency: 8,
    lastCheck: new Date(),
    details: 'All brokers in sync',
  },
  {
    name: 'Vault',
    status: 'healthy',
    latency: 25,
    lastCheck: new Date(),
    details: 'Unsealed and operational',
  },
  {
    name: 'WhatsApp Gateway',
    status: 'healthy',
    latency: 120,
    lastCheck: new Date(),
    details: 'Connected to Twilio',
  },
  {
    name: 'Chat Agent',
    status: 'healthy',
    latency: 85,
    lastCheck: new Date(),
    details: '2 replicas running',
  },
  {
    name: 'Chatwoot',
    status: 'healthy',
    latency: 150,
    lastCheck: new Date(),
    details: 'Sidekiq processing normally',
  },
];

const getStatusIcon = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" />;
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
  }
};

export default function SystemHealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setServices(SERVICES.map((s) => ({ ...s, lastCheck: new Date() })));
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  const overallStatus =
    downCount > 0 ? 'critical' : degradedCount > 0 ? 'warning' : 'operational';

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
                Ultima verificacao: {lastRefresh.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              <p className="text-sm text-gray-600">Saudaveis</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{degradedCount}</p>
              <p className="text-sm text-gray-600">Degradados</p>
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
              <p className="text-sm text-gray-500">Nodes</p>
              <p className="text-xl font-semibold text-gray-900">2 / 2</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">CPU</p>
              <p className="text-xl font-semibold text-gray-900">42%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Memoria</p>
              <p className="text-xl font-semibold text-gray-900">68%</p>
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
              <p className="text-xl font-semibold text-gray-900">56ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Status dos Servicos</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {services.map((service) => (
            <div
              key={service.name}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
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
                    <p className="text-sm font-medium text-gray-900">{service.latency}ms</p>
                    <p className="text-xs text-gray-500">latencia</p>
                  </div>
                )}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    service.status
                  )}`}
                >
                  {service.status === 'healthy'
                    ? 'Saudavel'
                    : service.status === 'degraded'
                    ? 'Degradado'
                    : 'Fora do ar'}
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
