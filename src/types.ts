export type FinderTagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';

export interface FolderNode {
  id: string;
  name: string;
  tagColor?: FinderTagColor;
  children?: FolderNode[];
  isExpanded?: boolean;
  enabled?: boolean; // When false, this folder and its subtree will not be created
}

export type TemplateCategory = 'all' | 'video' | 'photo' | 'design' | 'dev' | 'business' | 'education' | 'finance';

export interface PresetTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  iconName: string;
  rootFolder: FolderNode;
}

export interface BatchItem {
  id: string;
  name: string;
  selected: boolean;
}

export interface FolderStats {
  totalFolders: number;
  maxDepth: number;
  hasTags: number;
}
