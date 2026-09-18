import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Tag,
  Search,
  CheckSquare,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import { FolderNode, FinderTagColor } from '../types';
import { FINDER_TAG_COLORS, calculateFolderStats } from '../utils/macFolderUtils';

interface FinderTreeViewProps {
  rootFolder: FolderNode;
  onChange: (updatedRoot: FolderNode) => void;
  onSelectNode?: (node: FolderNode) => void;
  selectedNodeId?: string;
  onExecuteMac: () => void;
}

export function FinderTreeView({
  rootFolder,
  onChange,
  onSelectNode,
  selectedNodeId,
  onExecuteMac,
}: FinderTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [activeTagPickerId, setActiveTagPickerId] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // Stats
  const stats = calculateFolderStats(rootFolder);

  // Helper to count total nodes (including disabled)
  const countAllNodes = (node: FolderNode): number => {
    let c = 1;
    if (node.children) {
      for (const child of node.children) {
        c += countAllNodes(child);
      }
    }
    return c;
  };
  const totalAvailable = countAllNodes(rootFolder);

  // Toggle expansion of a node
  const toggleExpand = (targetId: string) => {
    function update(node: FolderNode): FolderNode {
      if (node.id === targetId) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
  };

  // Toggle enabled/disabled for a node (and cascade to its children)
  const toggleNodeEnabled = (targetId: string) => {
    function update(node: FolderNode): FolderNode {
      if (node.id === targetId) {
        const nextState = node.enabled === false ? true : false;
        const cascadeChildren = (children?: FolderNode[]): FolderNode[] | undefined => {
          if (!children) return undefined;
          return children.map((c) => ({
            ...c,
            enabled: nextState,
            children: cascadeChildren(c.children),
          }));
        };
        return {
          ...node,
          enabled: nextState,
          children: cascadeChildren(node.children),
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
  };

  // Mark all enabled or disabled
  const setAllEnabled = (enabled: boolean) => {
    function update(node: FolderNode): FolderNode {
      return {
        ...node,
        enabled,
        children: node.children ? node.children.map(update) : undefined,
      };
    }
    onChange(update(rootFolder));
  };

  // Expand / Collapse all
  const setAllExpanded = (expanded: boolean) => {
    function update(node: FolderNode): FolderNode {
      return {
        ...node,
        isExpanded: expanded,
        children: node.children ? node.children.map(update) : undefined,
      };
    }
    onChange(update(rootFolder));
  };

  // Add child folder
  const addChild = (parentId: string) => {
    const newId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    function update(node: FolderNode): FolderNode {
      if (node.id === parentId) {
        const num = ((node.children?.length || 0) + 1).toString().padStart(2, '0');
        const newFolder: FolderNode = {
          id: newId,
          name: `${num}_Nova_Pasta`,
          isExpanded: true,
          enabled: true,
          children: [],
        };
        return {
          ...node,
          isExpanded: true,
          children: [...(node.children || []), newFolder],
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
    setEditingId(newId);
    setEditName('Nova_Pasta');
  };

  // Move order up / down among siblings
  const moveNodeOrder = (targetId: string, direction: 'up' | 'down') => {
    if (targetId === rootFolder.id) return;

    function reorder(node: FolderNode): FolderNode {
      if (!node.children || node.children.length === 0) return node;

      const idx = node.children.findIndex((c) => c.id === targetId);
      if (idx !== -1) {
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx >= 0 && targetIdx < node.children.length) {
          const newChildren = [...node.children];
          const [moved] = newChildren.splice(idx, 1);
          newChildren.splice(targetIdx, 0, moved);
          return { ...node, children: newChildren };
        }
        return node;
      }

      return {
        ...node,
        children: node.children.map(reorder),
      };
    }

    onChange(reorder(rootFolder));
  };

  // Delete folder
  const deleteFolder = (targetId: string) => {
    if (targetId === rootFolder.id) return;
    function update(node: FolderNode): FolderNode | null {
      if (node.id === targetId) return null;
      if (node.children) {
        const filtered = node.children
          .map(update)
          .filter((n): n is FolderNode => n !== null);
        return { ...node, children: filtered };
      }
      return node;
    }
    const res = update(rootFolder);
    if (res) onChange(res);
  };

  // Rename folder commit
  const commitRename = (id: string) => {
    const cleaned = editName.trim().replace(/[\\/:*?"<>|]/g, '_');
    if (!cleaned) {
      setEditingId(null);
      return;
    }
    function update(node: FolderNode): FolderNode {
      if (node.id === id) {
        return { ...node, name: cleaned };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
    setEditingId(null);
  };

  // Start renaming
  const startRename = (node: FolderNode) => {
    setEditingId(node.id);
    setEditName(node.name);
  };

  // Set Finder tag color
  const setTag = (id: string, color?: FinderTagColor) => {
    function update(node: FolderNode): FolderNode {
      if (node.id === id) {
        return { ...node, tagColor: color };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
    setActiveTagPickerId(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === rootFolder.id) return;
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNodeId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetNode: FolderNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeId || draggedNodeId === targetNode.id) return;

    // Check if target is descendant of draggedNode
    function isDescendant(parent: FolderNode, childId: string): boolean {
      if (parent.id === childId) return true;
      if (parent.children) {
        return parent.children.some((c) => isDescendant(c, childId));
      }
      return false;
    }
    function findNodeById(current: FolderNode, id: string): FolderNode | null {
      if (current.id === id) return current;
      if (current.children) {
        for (const child of current.children) {
          const res = findNodeById(child, id);
          if (res) return res;
        }
      }
      return null;
    }

    const draggedNode = findNodeById(rootFolder, draggedNodeId);
    if (draggedNode && isDescendant(draggedNode, targetNode.id)) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let pos: 'before' | 'after' | 'inside' = 'inside';
    if (targetNode.id === rootFolder.id) {
      pos = 'inside';
    } else if (offsetY < height * 0.25) {
      pos = 'before';
    } else if (offsetY > height * 0.75) {
      pos = 'after';
    } else {
      pos = 'inside';
    }

    setDragOverNodeId(targetNode.id);
    setDragOverPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, targetNode: FolderNode) => {
    e.preventDefault();
    e.stopPropagation();

    const movingId = draggedNodeId || e.dataTransfer.getData('text/plain');
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDragOverPosition(null);

    if (!movingId || movingId === targetNode.id || movingId === rootFolder.id) return;

    // 1. Extract moving node from root
    let extractedNode: FolderNode | null = null;
    function removeNode(current: FolderNode): FolderNode {
      if (!current.children) return current;
      const idx = current.children.findIndex((c) => c.id === movingId);
      if (idx !== -1) {
        extractedNode = current.children[idx];
        const newChildren = [...current.children];
        newChildren.splice(idx, 1);
        return { ...current, children: newChildren };
      }
      return {
        ...current,
        children: current.children.map(removeNode),
      };
    }

    const treeWithoutMoving = removeNode(rootFolder);
    if (!extractedNode) return;

    // 2. Insert into destination
    const nodeToInsert = extractedNode as FolderNode;
    const position = dragOverPosition || 'inside';

    function insertNode(current: FolderNode): FolderNode {
      if (position === 'inside' && current.id === targetNode.id) {
        return {
          ...current,
          isExpanded: true,
          children: [...(current.children || []), nodeToInsert],
        };
      }

      if (current.children) {
        const idx = current.children.findIndex((c) => c.id === targetNode.id);
        if (idx !== -1) {
          const newChildren = [...current.children];
          if (position === 'before') {
            newChildren.splice(idx, 0, nodeToInsert);
          } else if (position === 'after') {
            newChildren.splice(idx + 1, 0, nodeToInsert);
          }
          return { ...current, children: newChildren };
        }

        return {
          ...current,
          children: current.children.map(insertNode),
        };
      }

      return current;
    }

    const finalTree = insertNode(treeWithoutMoving);
    onChange(finalTree);
  };

  // Render a node recursively
  const renderNode = (
    node: FolderNode,
    depth = 0,
    indexInParent = 0,
    totalSiblings = 1
  ) => {
    const isRoot = node.id === rootFolder.id;
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingId === node.id;
    const isSelected = selectedNodeId === node.id;
    const isEnabled = node.enabled !== false;
    const isFirstSibling = indexInParent === 0;
    const isLastSibling = indexInParent === totalSiblings - 1;

    const isDragOver = dragOverNodeId === node.id;

    const matchesSearch =
      !searchQuery ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase());

    const hasMatchingDescendant = (n: FolderNode): boolean => {
      if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      if (n.children) return n.children.some(hasMatchingDescendant);
      return false;
    };

    if (searchQuery && !matchesSearch && !hasMatchingDescendant(node)) {
      return null;
    }

    return (
      <div
        key={node.id}
        className={`relative group ${draggedNodeId === node.id ? 'opacity-40' : ''}`}
        onDragOver={(e) => handleDragOver(e, node)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, node)}
      >
        {/* Drop indicators for reordering */}
        {isDragOver && dragOverPosition === 'before' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-full z-20 shadow-md shadow-blue-500/50 -translate-y-1/2" />
        )}
        {isDragOver && dragOverPosition === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full z-20 shadow-md shadow-blue-500/50 translate-y-1/2" />
        )}

        <div
          id={`folder-row-${node.id}`}
          draggable={!isRoot && !isEditing}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onClick={() => onSelectNode?.(node)}
          className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition select-none cursor-pointer border ${
            isDragOver && dragOverPosition === 'inside'
              ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/50'
              : isSelected
              ? 'bg-blue-600/20 text-white border-blue-500/40'
              : isEnabled
              ? 'hover:bg-white/5 text-neutral-200 border-transparent'
              : 'hover:bg-white/5 text-neutral-500 border-transparent opacity-60'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 22 + 8)}px` }}
        >
          {/* Left section: Drag handle, Checkbox, expand toggle, folder icon, folder name */}
          <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
            {/* Drag Handle */}
            {!isRoot ? (
              <div
                className="opacity-20 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-white p-0.5 rounded transition flex-shrink-0"
                title="Arraste para mover ou reordenar"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-3.5 flex-shrink-0" />
            )}

            {/* Folder Selection Checkbox */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeEnabled(node.id);
              }}
              className={`w-4 h-4 rounded flex items-center justify-center transition border flex-shrink-0 ${
                isEnabled
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-neutral-800 border-white/20 text-transparent hover:border-white/40'
              }`}
              title={isEnabled ? 'Pasta marcada para ser criada (clique para desmarcar)' : 'Pasta desmarcada'}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </button>

            {/* Expand / Collapse toggle */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-white flex-shrink-0"
              >
                {node.isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 flex-shrink-0" />
            )}

            {/* macOS Folder Icon */}
            <div className="relative flex-shrink-0">
              {node.isExpanded ? (
                <FolderOpen
                  className={`w-4 h-4 transition ${
                    isEnabled
                      ? 'text-[#5AC8FA] fill-[#5AC8FA]/20'
                      : 'text-neutral-500 fill-neutral-600/10'
                  }`}
                />
              ) : (
                <Folder
                  className={`w-4 h-4 transition ${
                    isEnabled
                      ? 'text-[#5AC8FA] fill-[#5AC8FA]/20'
                      : 'text-neutral-500 fill-neutral-600/10'
                  }`}
                />
              )}
              {node.tagColor && isEnabled && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-neutral-900 shadow-sm"
                  style={{ backgroundColor: FINDER_TAG_COLORS[node.tagColor].bg }}
                  title={`Tag do Finder: ${FINDER_TAG_COLORS[node.tagColor].label}`}
                />
              )}
            </div>

            {/* Folder Name (Inline edit or text) */}
            {isEditing ? (
              <div
                className="flex items-center space-x-1.5 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(node.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  placeholder="Nome da pasta..."
                  className="bg-neutral-800 border-2 border-blue-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-full font-mono shadow-sm"
                />
                <button
                  onClick={() => commitRename(node.id)}
                  className="p-1 hover:bg-green-500/20 text-green-400 rounded transition flex-shrink-0"
                  title="Salvar novo nome (Enter)"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded transition flex-shrink-0"
                  title="Cancelar (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(node);
                  }}
                  className={`text-xs font-mono truncate cursor-pointer hover:underline ${
                    isEnabled ? 'text-neutral-200' : 'text-neutral-500 line-through'
                  }`}
                  title={`${node.name} (Dois cliques para renomear)`}
                >
                  {node.name}
                </span>

                {/* Visible Rename Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(node);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-blue-400 transition flex items-center space-x-1 text-[11px]"
                  title="Renomear esta pasta"
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="text-[10px] hidden sm:inline">Renomear</span>
                </button>
              </div>
            )}
          </div>

          {/* Right section: Reorder Up/Down arrows, Finder Tag dot & Actions */}
          <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 flex-shrink-0">
            {/* Move Up / Down Buttons */}
            {!isRoot && totalSiblings > 1 && (
              <div className="flex items-center bg-black/30 rounded p-0.5 border border-white/5 mr-1">
                <button
                  type="button"
                  disabled={isFirstSibling}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveNodeOrder(node.id, 'up');
                  }}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-400 transition"
                  title="Mover para cima na ordem"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={isLastSibling}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveNodeOrder(node.id, 'down');
                  }}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-400 transition"
                  title="Mover para baixo na ordem"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Tag Picker Popover */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTagPickerId(
                    activeTagPickerId === node.id ? null : node.id
                  );
                }}
                className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition"
                title="Alterar Tag de Cor (macOS Finder)"
              >
                <Tag className="w-3 h-3" />
              </button>

              {activeTagPickerId === node.id && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 bg-neutral-800/95 backdrop-blur-md border border-white/15 rounded-lg shadow-xl p-2 flex items-center space-x-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(
                    ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'] as FinderTagColor[]
                  ).map((c) => (
                    <button
                      key={c}
                      onClick={() => setTag(node.id, c)}
                      className="w-3.5 h-3.5 rounded-full hover:scale-125 transition border border-black/20"
                      style={{ backgroundColor: FINDER_TAG_COLORS[c].bg }}
                      title={FINDER_TAG_COLORS[c].label}
                    />
                  ))}
                  <button
                    onClick={() => setTag(node.id, undefined)}
                    className="text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
                    title="Remover cor"
                  >
                    Sem
                  </button>
                </div>
              )}
            </div>

            {/* Quick add subfolder */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addChild(node.id);
              }}
              className="p-1 rounded hover:bg-blue-500/20 text-neutral-400 hover:text-blue-400 transition"
              title="Adicionar subpasta"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Delete button (except root) */}
            {!isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(node.id);
                }}
                className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                title="Excluir pasta"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && node.isExpanded && (
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 border-l border-white/5 pointer-events-none"
              style={{ left: `${depth * 22 + 15}px` }}
            />
            {node.children!.map((child, idx) =>
              renderNode(child, depth + 1, idx, node.children!.length)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#18191e]/80 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Banner: Quick Folder Selection Controls & Rename hint */}
      <div className="bg-neutral-900/90 border-b border-white/10 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Selection Counter & Bulk Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-blue-600/15 border border-blue-500/30 px-3 py-1 rounded-lg">
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-neutral-300 font-medium">
              Pastas a serem criadas:
            </span>
            <span className="font-mono font-bold text-white bg-blue-500/30 px-1.5 py-0.5 rounded text-[11px]">
              {stats.totalFolders} de {totalAvailable}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setAllEnabled(true)}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] transition"
              title="Marcar todas as pastas"
            >
              Marcar Todas
            </button>
            <button
              onClick={() => setAllEnabled(false)}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] transition"
              title="Desmarcar todas as pastas"
            >
              Desmarcar Todas
            </button>
          </div>
        </div>

        {/* Right: Search + Add Folder */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <div className="relative max-w-xs w-full min-w-[150px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="finder-search-input"
              type="text"
              placeholder="Buscar pasta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-md pl-8 pr-7 py-1 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => addChild(rootFolder.id)}
            className="flex items-center space-x-1 px-3 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white transition font-medium text-xs whitespace-nowrap"
            title="Criar nova pasta na raiz"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Pasta</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Instructions & Expand/Collapse */}
      <div className="bg-neutral-900/40 border-b border-white/5 px-3 py-2 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center space-x-2">
          <span>
            💡 Reordene com as setas <ArrowUp className="w-3 h-3 inline text-neutral-300" /><ArrowDown className="w-3 h-3 inline text-neutral-300" /> ou <strong>arraste e solte</strong> para mudar a ordem ou aninhar pastas.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAllExpanded(true)}
            className="hover:text-neutral-200 transition"
          >
            Expandir tudo
          </button>
          <span>•</span>
          <button
            onClick={() => setAllExpanded(false)}
            className="hover:text-neutral-200 transition"
          >
            Recolher tudo
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
        {renderNode(rootFolder)}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-neutral-900/90 border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-400">
          Total selecionado:{' '}
          <strong className="text-blue-400 font-mono">
            {stats.totalFolders} {stats.totalFolders === 1 ? 'pasta' : 'pastas'}
          </strong>
        </div>

        <button
          onClick={onExecuteMac}
          disabled={stats.totalFolders === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition active:scale-95"
        >
          <span>🍏</span>
          <span>Criar {stats.totalFolders} Pastas Selecionadas no Mac</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
