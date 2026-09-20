import { FolderNode } from '../types';

export interface SavedTemplate {
  id: string;
  name: string;
  createdAt: string;
  rootFolder: FolderNode;
}
