import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { FolderNode, FinderTagColor } from '../types';
import { FINDER_TAG_COLORS } from '../utils/macFolderUtils';

interface FinderColumnViewProps {
  rootFolder: FolderNode;
  onChange: (updatedRoot: FolderNode) => void;
}

export function FinderColumnView({ rootFolder, onChange }: FinderColumnViewProps) {
  // Selected path of folder IDs for each column: [rootId, childId, grandChildId, ...]
  const [selectedPath, setSelectedPath] = useState<string[]>([rootFolder.id]);

  // Rename states in Column View
  const [isRenamingActive, setIsRenamingActive] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Helper to find a node by ID in the tree
  function findNode(current: FolderNode, id: string): FolderNode | null {
    if (current.id === id) return current;
    if (current.children) {
      for (const child of current.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Build the list of columns to display
  const columns: { parentNode: FolderNode; items: FolderNode[] }[] = [];

  // First column: Root's children
  columns.push({
    parentNode: rootFolder,
    items: rootFolder.children || [],
  });

  // Subsequent columns for selected folders
  for (let i = 1; i < selectedPath.length; i++) {
    const parentId = selectedPath[i];
    const parentNode = findNode(rootFolder, parentId);
    if (parentNode && parentNode.children && parentNode.children.length > 0) {
      columns.push({
        parentNode,
        items: parentNode.children,
      });
    }
  }

  // Handle selecting an item at a specific column depth
  const handleSelect = (depth: number, item: FolderNode) => {
    const newPath = selectedPath.slice(0, depth + 1);
    newPath[depth + 1] = item.id;
    setSelectedPath(newPath);
    setIsRenamingActive(false);
  };

  // Move item up / down in its parent's children list
  const handleMoveOrder = (parentId: string, targetId: string, direction: 'up' | 'down') => {
    function reorder(node: FolderNode): FolderNode {
      if (node.id === parentId) {
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
        }
        return node;
      }
      if (node.children) {
        return { ...node, children: node.children.map(reorder) };
      }
      return node;
    }
    onChange(reorder(rootFolder));
  };

  // Toggle selection (enabled/disabled) of a node and cascade
  const handleToggleEnabled = (nodeId: string) => {
    function update(node: FolderNode): FolderNode {
      if (node.id === nodeId) {
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

  // Add subfolder to column parent
  const handleAddFolder = (parentNodeId: string) => {
    const newId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    function update(node: FolderNode): FolderNode {
      if (node.id === parentNodeId) {
        const nextNumber = ((node.children?.length || 0) + 1).toString().padStart(2, '0');
        const newFolder: FolderNode = {
          id: newId,
          name: `${nextNumber}_Nova_Pasta`,
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
  };

  // Rename folder commit
  const commitRename = (nodeId: string, newName: string) => {
    const cleaned = newName.trim().replace(/[\\/:*?"<>|]/g, '_');
    if (!cleaned) {
      setIsRenamingActive(false);
      return;
    }
    function update(node: FolderNode): FolderNode {
      if (node.id === nodeId) {
        return { ...node, name: cleaned };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
    setIsRenamingActive(false);
  };

  // Delete folder
  const handleDelete = (targetId: string) => {
    if (targetId === rootFolder.id) return;
    function update(node: FolderNode): FolderNode | null {
      if (node.id === targetId) return null;
      if (node.children) {
        return {
          ...node,
          children: node.children
            .map(update)
            .filter((n): n is FolderNode => n !== null),
        };
      }
      return node;
    }
    const res = update(rootFolder);
    if (res) onChange(res);
    setSelectedPath((prev) => prev.filter((id) => id !== targetId));
    setIsRenamingActive(false);
  };

  // Change Tag Color
  const handleChangeTag = (nodeId: string, color?: FinderTagColor) => {
    function update(node: FolderNode): FolderNode {
      if (node.id === nodeId) {
        return { ...node, tagColor: color };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    }
    onChange(update(rootFolder));
  };

  const lastSelectedId = selectedPath[selectedPath.length - 1];
  const activeNode = findNode(rootFolder, lastSelectedId) || rootFolder;
  const isActiveNodeEnabled = activeNode.enabled !== false;

  return (
    <div className="flex flex-col h-full bg-[#18191e]/80 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Breadcrumb Bar */}
      <div className="bg-neutral-900/90 border-b border-white/10 px-4 py-2 flex items-center space-x-1.5 text-xs text-neutral-300 overflow-x-auto whitespace-nowrap">
        <span className="text-neutral-500">Caminho no Mac:</span>
        <span className="font-semibold text-blue-400">~/Desktop</span>
        <ChevronRight className="w-3 h-3 text-neutral-600" />
        <span className="font-medium text-white">{rootFolder.name}</span>
        {selectedPath.slice(1).map((id) => {
          const n = findNode(rootFolder, id);
          if (!n) return null;
          return (
            <div key={id} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className={n.enabled === false ? 'text-neutral-500 line-through' : 'text-neutral-300'}>
                {n.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Miller Columns Container */}
      <div className="flex-1 flex overflow-x-auto divide-x divide-white/10">
        {columns.map((col, depth) => {
          const selectedIdAtThisDepth = selectedPath[depth + 1];

          return (
            <div
              key={`${col.parentNode.id}-${depth}`}
              className="w-64 min-w-[16rem] max-w-[16rem] flex flex-col bg-black/20"
            >
              {/* Column Header */}
              <div className="bg-neutral-900/60 px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate max-w-[140px] font-medium" title={col.parentNode.name}>
                  {col.parentNode.name}
                </span>
                <button
                  onClick={() => handleAddFolder(col.parentNode.id)}
                  className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition"
                  title="Adicionar pasta nesta coluna"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Column Item List */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                {col.items.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 italic">
                    (Pasta Vazia)
                  </div>
                ) : (
                  col.items.map((item, idx) => {
                    const isSelected = selectedIdAtThisDepth === item.id;
                    const hasChildren = item.children && item.children.length > 0;
                    const isEnabled = item.enabled !== false;
                    const isFirst = idx === 0;
                    const isLast = idx === col.items.length - 1;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(depth, item)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition select-none group ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : isEnabled
                            ? 'text-neutral-200 hover:bg-white/5'
                            : 'text-neutral-500 hover:bg-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 mr-1">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEnabled(item.id);
                            }}
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition border flex-shrink-0 ${
                              isEnabled
                                ? isSelected
                                  ? 'bg-white text-blue-600 border-white'
                                  : 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-neutral-800 border-white/20 text-transparent hover:border-white/40'
                            }`}
                            title={isEnabled ? 'Pasta marcada para criação' : 'Pasta desmarcada'}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>

                          <div className="relative flex-shrink-0">
                            {isSelected ? (
                              <FolderOpen className="w-3.5 h-3.5 text-blue-200 fill-blue-200/20" />
                            ) : (
                              <Folder
                                className={`w-3.5 h-3.5 ${
                                  isEnabled
                                    ? 'text-[#5AC8FA] fill-[#5AC8FA]/20'
                                    : 'text-neutral-500 fill-neutral-600/10'
                                }`}
                              />
                            )}
                            {item.tagColor && isEnabled && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-black"
                                style={{ backgroundColor: FINDER_TAG_COLORS[item.tagColor].bg }}
                              />
                            )}
                          </div>
                          <span
                            className={`truncate font-mono text-[11px] ${
                              !isEnabled ? 'line-through text-neutral-500' : ''
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>

                        {/* Reorder Buttons (hover or selected) */}
                        <div className="flex items-center space-x-0.5">
                          {col.items.length > 1 && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center transition mr-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveOrder(col.parentNode.id, item.id, 'up');
                                }}
                                className="p-0.5 hover:bg-white/20 rounded disabled:opacity-20 transition text-inherit"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveOrder(col.parentNode.id, item.id, 'down');
                                }}
                                className="p-0.5 hover:bg-white/20 rounded disabled:opacity-20 transition text-inherit"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {hasChildren && (
                            <ChevronRight
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isSelected ? 'text-white' : 'text-neutral-500'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Right Details Panel for the currently highlighted folder */}
        <div className="w-72 min-w-[18rem] bg-neutral-900/70 p-4 flex flex-col justify-between border-l border-white/10">
          <div>
            <div className="flex items-center justify-center py-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FolderOpen className="w-8 h-8" />
              </div>
            </div>

            {/* Rename section inside details panel */}
            <div className="text-center mb-4">
              {isRenamingActive ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(activeNode.id, renameValue);
                      if (e.key === 'Escape') setIsRenamingActive(false);
                    }}
                    autoFocus
                    placeholder="Nome da pasta..."
                    className="bg-neutral-800 border-2 border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none w-full font-mono text-center"
                  />
                  <div className="flex space-x-1 justify-center">
                    <button
                      onClick={() => commitRename(activeNode.id, renameValue)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Salvar</span>
                    </button>
                    <button
                      onClick={() => setIsRenamingActive(false)}
                      className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-white text-sm break-all font-mono">
                    {activeNode.name}
                  </h3>
                  <button
                    onClick={() => {
                      setIsRenamingActive(true);
                      setRenameValue(activeNode.name);
                    }}
                    className="mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 text-xs border border-white/5 transition"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Renomear Pasta</span>
                  </button>
                </div>
              )}

              <p className="text-[11px] text-neutral-400 mt-2">
                {activeNode.children?.length || 0} itens contidos
              </p>
            </div>

            <div className="space-y-3 text-xs border-t border-white/10 pt-3">
              {/* Checkbox toggle inside details */}
              <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-neutral-300 text-xs font-medium">
                  Criar esta pasta:
                </span>
                <button
                  onClick={() => handleToggleEnabled(activeNode.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isActiveNodeEnabled
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Check className={`w-3 h-3 ${isActiveNodeEnabled ? 'opacity-100' : 'opacity-20'}`} />
                  <span>{isActiveNodeEnabled ? 'Selecionada' : 'Ignorar'}</span>
                </button>
              </div>

              <div>
                <span className="text-neutral-400 text-[11px] block mb-1.5">
                  Etiquetas de Cor (Finder Tags):
                </span>
                <div className="flex items-center space-x-1.5">
                  {(
                    ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'] as FinderTagColor[]
                  ).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleChangeTag(activeNode.id, color)}
                      className={`w-4 h-4 rounded-full border transition ${
                        activeNode.tagColor === color
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: FINDER_TAG_COLORS[color].bg }}
                      title={FINDER_TAG_COLORS[color].label}
                    />
                  ))}
                  {activeNode.tagColor && (
                    <button
                      onClick={() => handleChangeTag(activeNode.id, undefined)}
                      className="text-[10px] text-neutral-400 hover:text-white ml-1"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-400">
                  <span>Tipo:</span>
                  <span className="text-neutral-200">Pasta do macOS</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Subdiretórios:</span>
                  <span className="text-neutral-200">{activeNode.children?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/10">
            <button
              onClick={() => handleAddFolder(activeNode.id)}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Subpasta Aqui</span>
            </button>

            {activeNode.id !== rootFolder.id && (
              <button
                onClick={() => handleDelete(activeNode.id)}
                className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Pasta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
