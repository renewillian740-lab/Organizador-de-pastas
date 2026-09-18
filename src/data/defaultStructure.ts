import { FolderNode } from '../types';

/**
 * Estrutura inicial limpa e enxuta para o usuário escolher e customizar
 */
export const DEFAULT_ROOT_FOLDER: FolderNode = {
  id: 'root-mac',
  name: 'MEU_PROJETO_MAC',
  tagColor: 'blue',
  isExpanded: true,
  enabled: true,
  children: [
    {
      id: 'f-01',
      name: '01_ARQUIVOS_BRUTOS',
      tagColor: 'red',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-01-a', name: 'Originais', enabled: true },
        { id: 'f-01-b', name: 'Documentos', enabled: true },
        { id: 'f-01-c', name: 'Referencias', enabled: false },
      ],
    },
    {
      id: 'f-02',
      name: '02_TRABALHO_EM_ANDAMENTO',
      tagColor: 'yellow',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-02-a', name: 'Projetos_Editaveis', enabled: true },
        { id: 'f-02-b', name: 'Rascunhos', enabled: true },
        { id: 'f-02-c', name: 'Backups_Temporarios', enabled: false },
      ],
    },
    {
      id: 'f-03',
      name: '03_ENTREGAS_E_FINAIS',
      tagColor: 'green',
      isExpanded: true,
      enabled: true,
      children: [
        { id: 'f-03-a', name: 'Versao_Final_Aprovada', enabled: true },
        { id: 'f-03-b', name: 'Exportacoes_Web', enabled: true },
        { id: 'f-03-c', name: 'Comprovantes_e_Recibos', enabled: false },
      ],
    },
  ],
};
