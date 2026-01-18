'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot,
  Network,
  Layers,
  Headphones,
  Save,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  User,
} from 'lucide-react';
import { routingApi } from '@/lib/api/ontology';
import type { CanvasNode, CanvasEdge, RoutingRuleCreate, SourceType, DestinationType } from '@/lib/api/types';

// Custom edge data type for routing rules
interface RoutingEdgeData extends Record<string, unknown> {
  ruleId: string;
  priority: number;
  conditions: Record<string, unknown>;
}

// Custom edge type with our data
type RoutingEdge = Edge<RoutingEdgeData>;

// Custom node component
function CustomNode({ data, type }: { data: CanvasNode['data']; type: string }) {
  const getIcon = () => {
    switch (type) {
      case 'client':
        return <User className="text-cyan-600" size={24} />;
      case 'ai_agent':
        return <Bot className="text-purple-600" size={24} />;
      case 'department':
        return <Network className="text-blue-600" size={24} />;
      case 'queue':
        return <Layers className="text-green-600" size={24} />;
      case 'agent':
        return <Headphones className="text-orange-600" size={24} />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'client':
        return 'bg-cyan-50 border-cyan-200';
      case 'ai_agent':
        return 'bg-purple-50 border-purple-200';
      case 'department':
        return 'bg-blue-50 border-blue-200';
      case 'queue':
        return 'bg-green-50 border-green-200';
      case 'agent':
        return data.isAvailable ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm min-w-[150px] ${getBgColor()}`}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <div>
          <div className="font-medium text-gray-900 text-sm">{data.label}</div>
          {type === 'client' && data.isEntryPoint && (
            <div className="text-xs text-cyan-600 font-medium">Ponto de Entrada</div>
          )}
          {type === 'ai_agent' && data.isDefault && (
            <div className="text-xs text-purple-600 font-medium">Padrão</div>
          )}
          {type === 'department' && (
            <div className="text-xs text-gray-500">
              {data.agentCount} atend. | {data.queueCount} filas
            </div>
          )}
          {type === 'queue' && data.pendingCount !== undefined && (
            <div className="text-xs text-gray-500">{data.pendingCount} na fila</div>
          )}
          {type === 'agent' && (
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
          )}
        </div>
      </div>
    </div>
  );
}

// Node types for React Flow
const nodeTypes = {
  client: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="client" />,
  ai_agent: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="ai_agent" />,
  department: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="department" />,
  queue: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="queue" />,
  agent: (props: { data: CanvasNode['data'] }) => <CustomNode data={props.data} type="agent" />,
};

// Valid routing rules (must match backend)
const VALID_ROUTING_RULES: Record<string, Set<string>> = {
  client: new Set(['ai_agent', 'department', 'queue']),
  ai_agent: new Set(['department', 'queue', 'agent']),
  department: new Set(['department', 'queue', 'agent', 'ai_agent']),
  queue: new Set(['department', 'agent', 'ai_agent']),
  agent: new Set(['department', 'queue', 'ai_agent']),
};

export default function RoutingCanvasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RoutingEdge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RoutingEdge | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load canvas data from API
  const loadCanvasData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routingApi.getCanvasData();

      // Convert API nodes to React Flow nodes
      const flowNodes: Node[] = data.nodes.map((n: CanvasNode) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        draggable: true,
      }));

      // Convert API edges to React Flow edges
      const flowEdges: RoutingEdge[] = data.edges.map((e: CanvasEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#6366f1',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do canvas');
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadCanvasData();
  }, [loadCanvasData]);

  // Handle new connection (create routing rule)
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Parse source and target to get type and ID
      const parseNodeId = (nodeId: string): { type: string; id: string | null } => {
        // Handle single-word nodes (client, ai_agent legacy)
        if (nodeId === 'client') return { type: 'client', id: null };
        if (nodeId === 'ai_agent') return { type: 'ai_agent', id: null };

        // Handle prefixed nodes (ai_agent_uuid, department_uuid, etc.)
        const parts = nodeId.split('_');
        if (parts[0] === 'ai' && parts[1] === 'agent') {
          // ai_agent_uuid format
          return { type: 'ai_agent', id: parts.slice(2).join('_') || null };
        }
        // department_uuid, queue_uuid, agent_uuid format
        return { type: parts[0], id: parts.slice(1).join('_') };
      };

      const source = parseNodeId(connection.source);
      const target = parseNodeId(connection.target);

      // Validate connection using routing rules
      const validDestinations = VALID_ROUTING_RULES[source.type];
      if (!validDestinations) {
        setError(`Tipo de origem inválido: ${source.type}`);
        return;
      }

      if (!validDestinations.has(target.type)) {
        const validList = Array.from(validDestinations).join(', ');
        setError(`${source.type} não pode conectar a ${target.type}. Destinos válidos: ${validList}`);
        return;
      }

      // Client cannot be a destination
      if (target.type === 'client') {
        setError('Cliente não pode ser destino de roteamento');
        return;
      }

      try {
        // Create routing rule
        const rule: RoutingRuleCreate = {
          source_type: source.type as SourceType,
          source_id: source.id,
          destination_type: target.type as DestinationType,
          destination_id: target.id!,
          priority: 0,
          is_active: true,
        };

        const createdRule = await routingApi.create(rule);

        // Add edge to canvas
        const newEdge: RoutingEdge = {
          id: `edge_${createdRule.id}`,
          source: connection.source,
          target: connection.target,
          data: { ruleId: createdRule.id, priority: 0, conditions: {} },
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed' as const,
            color: '#6366f1',
          },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setHasChanges(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar conexão');
      }
    },
    [setEdges]
  );

  // Handle edge click (select for deletion)
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: RoutingEdge) => {
    setSelectedEdge(edge);
  }, []);

  // Delete selected edge
  const deleteSelectedEdge = async () => {
    if (!selectedEdge?.data?.ruleId) return;

    try {
      await routingApi.delete(selectedEdge.data.ruleId);
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conexão');
    }
  };

  // Save node positions
  const savePositions = async () => {
    try {
      setSaving(true);
      const positions = nodes.map((n) => {
        // Handle special node IDs
        if (n.id === 'client') {
          return {
            node_type: 'client',
            node_id: undefined,
            position_x: n.position.x,
            position_y: n.position.y,
          };
        }
        if (n.id === 'ai_agent') {
          return {
            node_type: 'ai_agent',
            node_id: undefined,
            position_x: n.position.x,
            position_y: n.position.y,
          };
        }

        // Handle ai_agent_uuid format
        const parts = n.id.split('_');
        if (parts[0] === 'ai' && parts[1] === 'agent') {
          return {
            node_type: 'ai_agent',
            node_id: parts.slice(2).join('_'),
            position_x: n.position.x,
            position_y: n.position.y,
          };
        }

        // Standard format: type_uuid
        return {
          node_type: parts[0],
          node_id: parts.slice(1).join('_'),
          position_x: n.position.x,
          position_y: n.position.y,
        };
      });

      await routingApi.savePositions(positions);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar posições');
    } finally {
      setSaving(false);
    }
  };

  // Track position changes
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      if (changes.some((c) => c.type === 'position' && 'position' in c)) {
        setHasChanges(true);
      }
    },
    [onNodesChange]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canvas de Roteamento</h1>
          <p className="text-gray-600 mt-1">
            Arraste conexões entre nós para definir regras de delegação
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCanvasData}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Recarregar
          </button>
          <button
            onClick={savePositions}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar Posições' : 'Salvo'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'client':
                  return '#0891b2';
                case 'ai_agent':
                  return '#9333ea';
                case 'department':
                  return '#2563eb';
                case 'queue':
                  return '#16a34a';
                case 'agent':
                  return '#ea580c';
                default:
                  return '#6b7280';
              }
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

          {/* Legend Panel */}
          <Panel position="top-left" className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-700 mb-2">Legenda</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span>Cliente (Entrada)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>AI Agent</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Departamento</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Fila</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Atendente</span>
              </div>
            </div>
          </Panel>

          {/* Instructions Panel */}
          <Panel position="bottom-left" className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm max-w-xs">
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Como usar:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Arraste os nós para organizar</li>
                <li>Conecte arrastando de um nó para outro</li>
                <li>Clique em uma conexão para selecioná-la</li>
                <li>Salve as posições após organizar</li>
              </ul>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Selected Edge Panel */}
      {selectedEdge && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg border border-gray-200 shadow-lg p-4 flex items-center gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Conexão selecionada</div>
            <div className="text-xs text-gray-500">
              {selectedEdge.source} → {selectedEdge.target}
            </div>
          </div>
          <button
            onClick={deleteSelectedEdge}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 size={16} />
            Deletar
          </button>
          <button
            onClick={() => setSelectedEdge(null)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
