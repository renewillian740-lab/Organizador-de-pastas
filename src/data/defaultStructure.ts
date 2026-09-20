import { FolderNode } from '../types';

/**
 * Estrutura inicial limpa e enxuta para o usuário escolher e customizar
 */
export const DEFAULT_ROOT_FOLDER: FolderNode = {
  id: 'root-mac',
  name: 'NOME_PROJETO',
  tagColor: 'blue',
  isExpanded: true,
  enabled: true,
  children: [
    {
      id: 'f-01',
      name: '01_PROJETOS',
      tagColor: 'purple',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-01-a', name: 'Premiere_AfterEffects', enabled: true },
        { id: 'f-01-b', name: 'Photoshop_Illustrator', enabled: true },
        { id: 'f-01-c', name: 'Rascunhos_e_Testes', enabled: false },
      ],
    },
    {
      id: 'f-02',
      name: '02_FOOTAGE',
      tagColor: 'red',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-02-a', name: 'Camera_01', enabled: true },
        { id: 'f-02-b', name: 'Camera_02', enabled: true },
        { id: 'f-02-c', name: 'Drones_e_Externas', enabled: false },
      ],
    },
    {
      id: 'f-03',
      name: '03_ASSETS',
      tagColor: 'yellow',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-03-a', name: 'Audios_e_Trilhas', enabled: true },
        { id: 'f-03-b', name: 'Imagens_e_Logos', enabled: true },
        { id: 'f-03-c', name: 'Fontes_e_Docs', enabled: false },
      ],
    },
    {
      id: 'f-04',
      name: '04_EXPORT',
      tagColor: 'green',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-04-a', name: 'Versao_Final_Aprovada', enabled: true },
        { id: 'f-04-b', name: 'Previa_Cliente', enabled: true },
        { id: 'f-04-c', name: 'Formatos_Sociais', enabled: false },
      ],
    },
  ],
};
