import JSZip from 'jszip';
import { FolderNode, FolderStats, FinderTagColor } from '../types';

/**
 * Calculates total folders, depth and tags in a tree (only counting enabled folders)
 */
export function calculateFolderStats(root: FolderNode): FolderStats {
  let count = 0;
  let maxDepth = 0;
  let hasTags = 0;

  function traverse(node: FolderNode, depth: number) {
    if (node.enabled === false) return;
    count++;
    if (depth > maxDepth) maxDepth = depth;
    if (node.tagColor) hasTags++;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(root, 1);
  return { totalFolders: count, maxDepth, hasTags };
}

/**
 * Flattens the tree into relative paths for mkdir (only enabled folders)
 */
export function getRelativePaths(node: FolderNode, currentPath = ''): { path: string; tag?: FinderTagColor }[] {
  if (node.enabled === false) return [];

  const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
  const list: { path: string; tag?: FinderTagColor }[] = [{ path: fullPath, tag: node.tagColor }];

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      list.push(...getRelativePaths(child, fullPath));
    }
  }

  return list;
}

/**
 * Generates a macOS .command executable script
 * In macOS, a file with .command extension can be double-clicked in Finder to run in Terminal!
 */
export function generateMacShellScript(root: FolderNode, targetBase = 'Desktop'): string {
  const paths = getRelativePaths(root);

  return `#!/bin/bash
# ==============================================================================
# Script Gerador Automático de Pastas para macOS
# Gerado por: Organizador Automático de Pastas para Mac
# ==============================================================================

clear
echo "🍏 Iniciando criação automática de pastas no seu Mac..."
echo ""

# Determina o diretório de destino (Padrão: Mesa / Desktop)
TARGET_DIR="$HOME/${targetBase}"

if [ ! -d "$TARGET_DIR" ]; then
  # Fallback caso o macOS esteja em outro idioma (ex: Mesa em português)
  if [ -d "$HOME/Mesa" ]; then
    TARGET_DIR="$HOME/Mesa"
  else
    TARGET_DIR="$HOME/Desktop"
  fi
fi

cd "$TARGET_DIR" || exit 1
echo "📁 Destino: $TARGET_DIR"
echo "⏳ Criando estrutura de pastas..."

${paths
  .map(
    (item) => `mkdir -p "${item.path}"`
  )
  .join('\n')}

echo ""
echo "✨ Sucesso! Todas as pastas foram criadas em:"
echo "   $TARGET_DIR/${root.name}"
echo ""

# Abre a pasta recém-criada diretamente no Finder
open "$TARGET_DIR/${root.name}"

echo "Pressione qualquer tecla para fechar..."
read -n 1 -s -r
exit 0
`;
}

/**
 * Generates an AppleScript snippet that can be pasted into macOS Script Editor
 * or saved as a native Mac .app
 */
export function generateAppleScript(root: FolderNode): string {
  const paths = getRelativePaths(root);

  return `(*
  AppleScript para criação automática de pastas no macOS
  Pode ser executado no 'Editor de Scripts' ou exportado como Aplicativo (.app)
*)

tell application "Finder"
  set targetFolder to (path to desktop folder as text)
  set rootFolderName to "${root.name}"
  
  -- Cria a pasta raiz na Mesa (Desktop) se não existir
  if not (exists folder (targetFolder & rootFolderName)) then
    make new folder at folder targetFolder with properties {name:rootFolderName}
  end if
  
  display notification "Pastas sendo geradas automaticamente..." with title "Organizador Mac"
end tell

-- Cria toda a árvore via shell com alta performance
do shell script "cd ~/Desktop && mkdir -p ${paths.map(p => `\\"${p.path}\\"`).join(' ')}"

tell application "Finder"
  -- Abre a pasta no Finder
  reveal folder (targetFolder & rootFolderName)
  activate
  display dialog "Estrutura de pastas criada com sucesso no seu Mac!" buttons {"OK"} default button 1 with icon note with title "Organizador Automático"
end tell
`;
}

/**
 * Creates folders directly in the Mac filesystem using Web File System Access API
 * Supported in Chrome, Edge, and modern desktop browsers
 */
export async function createFoldersDirectlyInMac(
  root: FolderNode,
  onProgress?: (createdCount: number, currentFolder: string) => void
): Promise<{ success: boolean; createdCount: number }> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('FILE_SYSTEM_NOT_SUPPORTED');
  }

  // User picks the destination folder on Mac (e.g. Desktop, Documents, External SSD)
  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'desktop',
  });

  let createdCount = 0;

  async function createRecursively(parentHandle: any, node: FolderNode) {
    if (node.enabled === false) return;

    // Create folder handle
    const currentHandle = await parentHandle.getDirectoryHandle(node.name, { create: true });
    createdCount++;
    if (onProgress) onProgress(createdCount, node.name);

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await createRecursively(currentHandle, child);
      }
    }
  }

  await createRecursively(dirHandle, root);

  return { success: true, createdCount };
}

/**
 * Generates a .zip file with the complete folder hierarchy for direct extraction
 */
export async function generateZipArchive(root: FolderNode): Promise<Blob> {
  const zip = new JSZip();

  function addToZip(node: FolderNode, currentPath = '') {
    if (node.enabled === false) return;

    const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
    // Create directory in zip
    zip.folder(fullPath);

    const activeChildren = (node.children || []).filter(c => c.enabled !== false);

    if (activeChildren.length > 0) {
      for (const child of activeChildren) {
        addToZip(child, fullPath);
      }
    } else {
      // Add a hidden .gitkeep or readme so empty folders are preserved when extracted in macOS Finder
      zip.file(`${fullPath}/.gitkeep`, '');
    }
  }

  addToZip(root);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Helper to download a text/command file to Mac
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Finder Color tag hex mappings
 */
export const FINDER_TAG_COLORS: Record<FinderTagColor, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: '#FF3B30', border: '#D70015', text: '#FFFFFF', label: 'Vermelho' },
  orange: { bg: '#FF9500', border: '#C96E00', text: '#FFFFFF', label: 'Laranja' },
  yellow: { bg: '#FFCC00', border: '#B28F00', text: '#000000', label: 'Amarelo' },
  green: { bg: '#34C759', border: '#248A3D', text: '#FFFFFF', label: 'Verde' },
  blue: { bg: '#007AFF', border: '#0051A8', text: '#FFFFFF', label: 'Azul' },
  purple: { bg: '#AF52DE', border: '#8944AB', text: '#FFFFFF', label: 'Roxo' },
  gray: { bg: '#8E8E93', border: '#636366', text: '#FFFFFF', label: 'Cinza' },
};
