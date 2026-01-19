'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  MessageCircle,
  Bot,
  Network,
  Layers,
  Headphones,
  Save,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  Plus,
  Maximize2,
  Minimize2,
  Loader2,
  Keyboard,
} from 'lucide-react';
import Link from 'next/link';
import { routingApi } from '@/lib/api/ontology';
import type { CanvasNode, CanvasEdge, RoutingRuleCreate, SourceType, DestinationType } from '@/lib/api/types';
import { nodeTypes } from './custom-node';

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Custom edge data type for routing rules
interface RoutingEdgeData extends Record<string, unknown> {
  ruleId: string;
  priority: number;
  conditions: Record<string, unknown>;
}

// Custom edge type with our data
type RoutingEdge = Edge<RoutingEdgeData>;

// Valid routing rules (must match backend)
const VALID_ROUTING_RULES: Record<string, Set<string>> = {
  integration: new Set(['ai_agent', 'department', 'queue']),
  ai_agent: new Set(['department', 'queue', 'agent']),
  department: new Set(['department', 'queue', 'agent', 'ai_agent']),
  queue: new Set(['department', 'agent', 'ai_agent']),
  agent: new Set(['department', 'queue', 'ai_agent']),
};

// Save status type
type SaveStatus = 'saved' | 'saving' | 'unsaved';

function RoutingCanvasContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RoutingEdge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RoutingEdge | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // New states for UI improvements
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const reactFlowInstance = useReactFlow();
  const nodesRef = useRef(nodes);

  // Keep nodesRef in sync
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

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

      // Convert API edges to React Flow edges with smooth styling
      const flowEdges: RoutingEdge[] = data.edges.map((e: CanvasEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'right',
        targetHandle: e.targetHandle || 'left',
        data: e.data,
        type: 'smoothstep',
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

  // Auto-save positions with debounce
  const autoSavePositions = useMemo(
    () =>
      debounce(async () => {
        const currentNodes = nodesRef.current;
        if (currentNodes.length === 0) return;

        try {
          setSaveStatus('saving');
          const positions = currentNodes.map((n) => {
            // Handle ai_agent legacy
            if (n.id === 'ai_agent') {
              return {
                node_type: 'ai_agent',
                node_id: undefined,
                position_x: n.position.x,
                position_y: n.position.y,
              };
            }

            // Handle prefixed formats
            const parts = n.id.split('_');

            // integration_uuid format
            if (parts[0] === 'integration') {
              return {
                node_type: 'integration',
                node_id: parts.slice(1).join('_'),
                position_x: n.position.x,
                position_y: n.position.y,
              };
            }

            // ai_agent_uuid format
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
          setSaveStatus('saved');
          setHasChanges(false);
        } catch (err) {
          console.error('Auto-save failed:', err);
          setSaveStatus('unsaved');
        }
      }, 1500),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete selected edge
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        e.preventDefault();
        deleteSelectedEdge();
      }

      // Escape - deselect or exit fullscreen
      if (e.key === 'Escape') {
        if (selectedEdge) {
          setSelectedEdge(null);
        } else if (isFullScreen) {
          setIsFullScreen(false);
        }
      }

      // F - fit view (when not in input)
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        reactFlowInstance?.fitView({ padding: 0.2 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, isFullScreen, reactFlowInstance, deleteSelectedEdge]);

  // Handle new connection (create routing rule)
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Parse source and target to get type and ID
      const parseNodeId = (nodeId: string): { type: string; id: string | null } => {
        // Handle single-word nodes (ai_agent legacy)
        if (nodeId === 'ai_agent') return { type: 'ai_agent', id: null };

        // Handle prefixed nodes (integration_uuid, ai_agent_uuid, department_uuid, etc.)
        const parts = nodeId.split('_');

        // integration_uuid format
        if (parts[0] === 'integration') {
          return { type: 'integration', id: parts.slice(1).join('_') };
        }

        // ai_agent_uuid format
        if (parts[0] === 'ai' && parts[1] === 'agent') {
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

      // Integration cannot be a destination
      if (target.type === 'integration') {
        setError('Integração é apenas ponto de entrada, não pode ser destino');
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
          sourceHandle: 'right',
          targetHandle: 'left',
          data: { ruleId: createdRule.id, priority: 0, conditions: {} },
          type: 'smoothstep',
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
  const deleteSelectedEdge = useCallback(async () => {
    if (!selectedEdge?.data?.ruleId) return;

    try {
      await routingApi.delete(selectedEdge.data.ruleId);
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conexão');
    }
  }, [selectedEdge, setEdges]);

  // Save node positions
  const savePositions = async () => {
    try {
      setSaving(true);
      const positions = nodes.map((n) => {
        // Handle ai_agent legacy
        if (n.id === 'ai_agent') {
          return {
            node_type: 'ai_agent',
            node_id: undefined,
            position_x: n.position.x,
            position_y: n.position.y,
          };
        }

        // Handle prefixed formats
        const parts = n.id.split('_');

        // integration_uuid format
        if (parts[0] === 'integration') {
          return {
            node_type: 'integration',
            node_id: parts.slice(1).join('_'),
            position_x: n.position.x,
            position_y: n.position.y,
          };
        }

        // ai_agent_uuid format
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

  // Track position changes and trigger auto-save
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // Check if any position changed (drag ended)
      const hasPositionChange = changes.some(
        (c) => c.type === 'position' && 'position' in c && c.dragging === false
      );
      if (hasPositionChange) {
        setHasChanges(true);
        setSaveStatus('unsaved');
        autoSavePositions();
      }
    },
    [onNodesChange, autoSavePositions]
  );

  // Check if there are no integrations
  const hasIntegrations = nodes.some((n) => n.type === 'integration');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Save status indicator component
  const SaveStatusIndicator = () => {
    if (saveStatus === 'saved') {
      return (
        <div className="flex items-center gap-1.5 text-green-600 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Salvo</span>
        </div>
      );
    }
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-1.5 text-yellow-600 text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>Salvando...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-orange-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span>Alterações não salvas</span>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-white p-4'
          : 'h-[calc(100vh-140px)]'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Canvas de Roteamento</h1>
            {!isFullScreen && (
              <p className="text-gray-600 mt-1">
                Arraste conexões entre nós para definir regras de delegação
              </p>
            )}
          </div>
          <SaveStatusIndicator />
        </div>
        <div className="flex gap-2">
          {!isFullScreen && (
            <Link
              href="/integrations"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus size={18} />
              Integração
            </Link>
          )}
          <button
            onClick={loadCanvasData}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Recarregar canvas"
          >
            <RefreshCw size={18} />
            {!isFullScreen && 'Recarregar'}
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={isFullScreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {!isFullScreen && 'Expandir'}
          </button>
          {!isFullScreen && (
            <button
              onClick={savePositions}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
            </button>
          )}
        </div>
      </div>

      {/* No integrations warning */}
      {!hasIntegrations && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>
              Nenhuma integração configurada. Adicione uma integração (WhatsApp, Instagram, etc.) para
              começar a receber conversas.
            </span>
          </div>
          <Link
            href="/integrations"
            className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            Adicionar Integração
          </Link>
        </div>
      )}

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
          connectionMode={ConnectionMode.Loose}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'integration':
                  return (node.data as CanvasNode['data']).color || '#0891b2';
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
                <MessageCircle size={14} className="text-green-500" />
                <span>Integração (Entrada)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Bot size={14} className="text-purple-500" />
                <span>AI Agent</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Network size={14} className="text-blue-500" />
                <span>Departamento</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Layers size={14} className="text-green-500" />
                <span>Fila</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Headphones size={14} className="text-orange-500" />
                <span>Atendente</span>
              </div>
            </div>
          </Panel>

          {/* Instructions Panel */}
          <Panel position="bottom-left" className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm max-w-xs">
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Como usar:</p>
              <ul className="space-y-1 list-disc list-inside mb-3">
                <li>Arraste os nós para organizar</li>
                <li>Conecte arrastando do ponto direito para o esquerdo</li>
                <li>Clique em uma conexão para selecioná-la</li>
                <li>Posições são salvas automaticamente</li>
              </ul>
              <div className="border-t border-gray-200 pt-2">
                <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Keyboard size={12} />
                  Atalhos:
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Deletar conexão</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Del</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Ajustar zoom</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Sair tela cheia</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Selected Edge Panel */}
      {selectedEdge && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg border border-gray-200 shadow-lg p-4 flex items-center gap-4 z-50">
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

// Wrap with ReactFlowProvider for useReactFlow hook
export default function RoutingCanvasPage() {
  return (
    <ReactFlowProvider>
      <RoutingCanvasContent />
    </ReactFlowProvider>
  );
}
