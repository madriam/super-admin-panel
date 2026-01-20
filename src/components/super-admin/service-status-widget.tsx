'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, HelpCircle, Activity } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'error' | 'unknown';
  latency?: number;
  lastChecked: string;
}

interface ServiceStatusResponse {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  summary: {
    ok: number;
    error: number;
    unknown: number;
    total: number;
  };
  checkedAt: string;
}

export function ServiceStatusWidget() {
  const [data, setData] = useState<ServiceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const response = await fetch('/api/services/status');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchStatus(), 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallStatusLabel = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return 'Todos os servicos operacionais';
      case 'degraded':
        return 'Alguns servicos com problemas';
      case 'critical':
        return 'Servicos criticos com falha';
      default:
        return 'Status desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Status dos Servicos</h3>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar status"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall Status Banner */}
      {data && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg border ${getOverallStatusColor(data.overall)}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {getOverallStatusLabel(data.overall)}
            </span>
            <span className="text-xs">
              {data.summary.ok}/{data.summary.total} online
            </span>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data?.services.map((service) => (
          <div
            key={service.name}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
          >
            {getStatusIcon(service.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {service.name}
              </p>
              {service.latency !== undefined && (
                <p className="text-xs text-gray-500">{service.latency}ms</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      {data && (
        <p className="mt-4 text-xs text-gray-400 text-right">
          Ultima verificacao: {new Date(data.checkedAt).toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}
