'use client';

import { Handle, Position } from '@xyflow/react';
import {
  Bot,
  Network,
  Layers,
  Headphones,
  MessageCircle,
  Instagram,
  Globe,
  Facebook,
  Send,
  Mail,
  Webhook,
  CheckCircle,
} from 'lucide-react';
import type { CanvasNode, IntegrationType } from '@/lib/api/types';

interface CustomNodeProps {
  data: CanvasNode['data'];
  type: string;
}

// Icon mapping for integration types
const integrationIcons: Record<IntegrationType, React.ComponentType<{ size?: number; className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  web_chat: Globe,
  messenger: Facebook,
  telegram: Send,
  email: Mail,
  api: Webhook,
};

export function CustomNode({ data, type }: CustomNodeProps) {
  const getIcon = () => {
    if (type === 'integration' && data.integrationType) {
      const IconComponent = integrationIcons[data.integrationType as IntegrationType] || Webhook;
      return (
        <IconComponent
          size={22}
          className="text-white"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}
        />
      );
    }

    switch (type) {
      case 'ai_agent':
        return <Bot className="text-purple-600" size={22} />;
      case 'department':
        return <Network className="text-blue-600" size={22} />;
      case 'queue':
        return <Layers className="text-green-600" size={22} />;
      case 'agent':
        return <Headphones className="text-orange-600" size={22} />;
      default:
        return <Webhook className="text-gray-600" size={22} />;
    }
  };

  const getStyles = () => {
    if (type === 'integration' && data.color) {
      return {
        container: 'border-2 shadow-md',
        style: { borderColor: data.color, backgroundColor: `${data.color}10` },
        iconBg: data.color,
      };
    }

    const styleMap: Record<string, { container: string; iconBg: string }> = {
      ai_agent: {
        container: 'bg-purple-50 border-purple-300 border-2 shadow-md',
        iconBg: 'transparent',
      },
      department: {
        container: 'bg-blue-50 border-blue-300 border-2 shadow-md',
        iconBg: 'transparent',
      },
      queue: {
        container: 'bg-green-50 border-green-300 border-2 shadow-md',
        iconBg: 'transparent',
      },
      agent: {
        container: data.isAvailable
          ? 'bg-orange-50 border-orange-300 border-2 shadow-md'
          : 'bg-gray-50 border-gray-300 border-2 shadow-md',
        iconBg: 'transparent',
      },
    };

    return styleMap[type] || { container: 'bg-gray-50 border-gray-300 border-2 shadow-md', iconBg: 'transparent' };
  };

  const getSubtitle = () => {
    switch (type) {
      case 'integration':
        return data.isVerified ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle size={12} />
            Verificado
          </span>
        ) : (
          <span className="text-xs text-gray-500 capitalize">{data.integrationType}</span>
        );
      case 'ai_agent':
        return data.isDefault ? (
          <span className="text-xs text-purple-600 font-medium">Padrão</span>
        ) : (
          <span className="text-xs text-gray-500">{data.model}</span>
        );
      case 'department':
        return (
          <span className="text-xs text-gray-500">
            {data.agentCount} atend. | {data.queueCount} filas
          </span>
        );
      case 'queue':
        return <span className="text-xs text-gray-500">{data.pendingCount ?? 0} na fila</span>;
      case 'agent':
        return (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                data.status === 'online'
                  ? 'bg-green-500'
                  : data.status === 'busy'
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-500 capitalize">{data.status}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const styles = getStyles();
  const isEntryPoint = type === 'integration';
  const isEndPoint = type === 'agent';

  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[180px] ${styles.container}`}
      style={styles.style}
    >
      {/* Handle LEFT (input) - not for entry points */}
      {!isEntryPoint && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
        />
      )}

      {/* Handle RIGHT (output) - not for end points (agents are end points for now) */}
      {!isEndPoint && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            type === 'integration' ? '' : 'bg-white/80'
          }`}
          style={type === 'integration' && data.color ? { backgroundColor: data.color } : undefined}
        >
          {getIcon()}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{data.label}</div>
          {getSubtitle()}
        </div>
      </div>

      {/* Entry point badge */}
      {isEntryPoint && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: data.color || '#6366f1' }}
        >
          →
        </div>
      )}
    </div>
  );
}

// Node type definitions for React Flow
export const nodeTypes = {
  integration: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="integration" />,
  ai_agent: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="ai_agent" />,
  department: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="department" />,
  queue: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="queue" />,
  agent: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="agent" />,
};
