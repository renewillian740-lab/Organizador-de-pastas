import { PresetTemplate } from '../types';

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'video-production',
    title: 'Produção de Vídeo & YouTube',
    category: 'video',
    description: 'Estrutura padrão de cinema e criadores de conteúdo para organizar filmagens, áudio e renders.',
    iconName: 'Video',
    rootFolder: {
      id: 'root-video',
      name: 'PROJETO_VIDEO_[NOME]',
      tagColor: 'purple',
      isExpanded: true,
      children: [
        {
          id: 'v-01',
          name: '01_FOOTAGE_BRUTO',
          tagColor: 'red',
          children: [
            { id: 'v-01-a', name: 'Camera_A' },
            { id: 'v-01-b', name: 'Camera_B' },
            { id: 'v-01-c', name: 'Drone_e_Gimbal' },
            { id: 'v-01-d', name: 'B-Roll' },
          ]
        },
        {
          id: 'v-02',
          name: '02_AUDIO_E_LOCUCAO',
          tagColor: 'yellow',
          children: [
            { id: 'v-02-a', name: 'Gravador_Lapela' },
            { id: 'v-02-b', name: 'Trilha_Sonora_Licenciada' },
            { id: 'v-02-c', name: 'Efeitos_Sonoros_SFX' },
            { id: 'v-02-d', name: 'Voz_Over' }
          ]
        },
        {
          id: 'v-03',
          name: '03_PROJETOS_EDITAVEIS',
          tagColor: 'blue',
          children: [
            { id: 'v-03-a', name: 'Premiere_Pro' },
            { id: 'v-03-b', name: 'After_Effects' },
            { id: 'v-03-c', name: 'DaVinci_Resolve' },
            { id: 'v-03-d', name: 'Auto_Saves' }
          ]
        },
        {
          id: 'v-04',
          name: '04_ELEMENTOS_GRAFICOS',
          tagColor: 'orange',
          children: [
            { id: 'v-04-a', name: 'Logos_e_Branding' },
            { id: 'v-04-b', name: 'Thumbnails' },
            { id: 'v-04-c', name: 'Lower_Thirds' },
            { id: 'v-04-d', name: 'Fontes' }
          ]
        },
        {
          id: 'v-05',
          name: '05_EXPORTS_FINAIS',
          tagColor: 'green',
          children: [
            { id: 'v-05-a', name: 'Versao_Aprovacao_Cliente' },
            { id: 'v-05-b', name: 'Master_4K_ProRes' },
            { id: 'v-05-c', name: 'Web_YouTube_H264' },
            { id: 'v-05-d', name: 'Reels_TikTok_Vertical' }
          ]
        },
        {
          id: 'v-06',
          name: '06_DOCUMENTOS',
          tagColor: 'gray',
          children: [
            { id: 'v-06-a', name: 'Roteiro_e_Decupagem' },
            { id: 'v-06-b', name: 'Termos_Uso_Imagem' },
            { id: 'v-06-c', name: 'Briefing' }
          ]
        }
      ]
    }
  },
  {
    id: 'photo-workflow',
    title: 'Fotografia Profissional & Ensaios',
    category: 'photo',
    description: 'Fluxo clássico de importação de cartões SD, seleção de curadoria, edição e entrega ao cliente.',
    iconName: 'Camera',
    rootFolder: {
      id: 'root-photo',
      name: 'ENSAIO_[CLIENTE]_[DATA]',
      tagColor: 'blue',
      isExpanded: true,
      children: [
        {
          id: 'p-01',
          name: '01_ORIGINAIS_RAW',
          tagColor: 'red',
          children: [
            { id: 'p-01-a', name: 'Cartao_SD_1' },
            { id: 'p-01-b', name: 'Cartao_SD_2' }
          ]
        },
        {
          id: 'p-02',
          name: '02_SELECAO_CURADORIA',
          tagColor: 'yellow',
          children: [
            { id: 'p-02-a', name: 'Estrelas_4_e_5' },
            { id: 'p-02-b', name: 'Descarte' }
          ]
        },
        {
          id: 'p-03',
          name: '03_EDICAO_PHOTOSHOP_LR',
          tagColor: 'purple',
          children: [
            { id: 'p-03-a', name: 'Catalogo_Lightroom' },
            { id: 'p-03-b', name: 'Arquivos_PSD_Master' }
          ]
        },
        {
          id: 'p-04',
          name: '04_ENTREGA_FINAL_CLIENTE',
          tagColor: 'green',
          children: [
            { id: 'p-04-a', name: 'Alta_Resolucao_Impressao' },
            { id: 'p-04-b', name: 'Otimizada_Web_Redes_Sociais' },
            { id: 'p-04-c', name: 'Com_Marca_Dagua' }
          ]
        }
      ]
    }
  },
  {
    id: 'design-branding',
    title: 'Design, UI/UX & Identidade Visual',
    category: 'design',
    description: 'Organização completa para designers com pastas de pesquisa, Figma, tipografias e mockups.',
    iconName: 'Palette',
    rootFolder: {
      id: 'root-design',
      name: 'DESIGN_[PROJETO]',
      tagColor: 'purple',
      isExpanded: true,
      children: [
        {
          id: 'd-01',
          name: '01_BRIEFING_E_RESEARCH',
          tagColor: 'blue',
          children: [
            { id: 'd-01-a', name: 'Moodboard_e_Referencias' },
            { id: 'd-01-b', name: 'Pesquisa_Concorrentes' },
            { id: 'd-01-c', name: 'Entrevistas_Usuarios' }
          ]
        },
        {
          id: 'd-02',
          name: '02_ASSETS_CLIENTE',
          tagColor: 'yellow',
          children: [
            { id: 'd-02-a', name: 'Logos_Antigos' },
            { id: 'd-02-b', name: 'Fotos_Institucionais' },
            { id: 'd-02-c', name: 'Manual_Marca_Existente' }
          ]
        },
        {
          id: 'd-03',
          name: '03_PRODUCAO_DESIGN',
          tagColor: 'orange',
          children: [
            { id: 'd-03-a', name: 'Figma_Backups' },
            { id: 'd-03-b', name: 'Ilustracoes_Vetores' },
            { id: 'd-03-c', name: 'Tipografia_Fontes' },
            { id: 'd-03-d', name: 'Mockups_PSD' }
          ]
        },
        {
          id: 'd-04',
          name: '04_APRESENTACOES',
          tagColor: 'purple',
          children: [
            { id: 'd-04-a', name: 'Etapa_01_Conceitos' },
            { id: 'd-04-b', name: 'Etapa_02_Aprovacao' }
          ]
        },
        {
          id: 'd-05',
          name: '05_ENTREGAVEIS_FINAIS',
          tagColor: 'green',
          children: [
            { id: 'd-05-a', name: 'Manual_Da_Marca_PDF' },
            { id: 'd-05-b', name: 'Logos_PNG_SVG_PDF' },
            { id: 'd-05-c', name: 'Paleta_Cores' }
          ]
        }
      ]
    }
  },
  {
    id: 'software-dev',
    title: 'Desenvolvimento de Software',
    category: 'dev',
    description: 'Arquitetura modular de diretórios para projetos de apps, APIs e microsserviços.',
    iconName: 'Code',
    rootFolder: {
      id: 'root-dev',
      name: 'app-workspace',
      tagColor: 'green',
      isExpanded: true,
      children: [
        {
          id: 'dev-01',
          name: 'src',
          tagColor: 'blue',
          children: [
            { id: 'dev-01-a', name: 'components' },
            { id: 'dev-01-b', name: 'hooks' },
            { id: 'dev-01-c', name: 'services' },
            { id: 'dev-01-d', name: 'utils' },
            { id: 'dev-01-e', name: 'types' }
          ]
        },
        {
          id: 'dev-02',
          name: 'public',
          children: [
            { id: 'dev-02-a', name: 'icons' },
            { id: 'dev-02-b', name: 'images' }
          ]
        },
        {
          id: 'dev-03',
          name: 'docs',
          tagColor: 'yellow',
          children: [
            { id: 'dev-03-a', name: 'architecture' },
            { id: 'dev-03-b', name: 'api-specs' },
            { id: 'dev-03-c', name: 'changelogs' }
          ]
        },
        {
          id: 'dev-04',
          name: 'scripts',
          children: [
            { id: 'dev-04-a', name: 'deploy' },
            { id: 'dev-04-b', name: 'build' }
          ]
        },
        {
          id: 'dev-05',
          name: 'tests',
          children: [
            { id: 'dev-05-a', name: 'unit' },
            { id: 'dev-05-b', name: 'e2e' }
          ]
        }
      ]
    }
  },
  {
    id: 'business-clients',
    title: 'Agência & Gestão de Clientes',
    category: 'business',
    description: 'Pastas organizadas para gerenciar clientes, contratos, reuniões e faturas.',
    iconName: 'Briefcase',
    rootFolder: {
      id: 'root-biz',
      name: 'CLIENTE_[EMPRESA]',
      tagColor: 'orange',
      isExpanded: true,
      children: [
        {
          id: 'b-01',
          name: '01_CONTRATOS_E_JURIDICO',
          tagColor: 'red',
          children: [
            { id: 'b-01-a', name: 'Contratos_Assinados' },
            { id: 'b-01-b', name: 'NDAs_Termos_Confidencialidade' },
            { id: 'b-01-c', name: 'Propostas_Comerciais' }
          ]
        },
        {
          id: 'b-02',
          name: '02_FINANCEIRO',
          tagColor: 'green',
          children: [
            { id: 'b-02-a', name: 'Notas_Fiscais_Emitidas' },
            { id: 'b-02-b', name: 'Comprovantes_Pagamento' },
            { id: 'b-02-c', name: 'Relatorios_Despesas' }
          ]
        },
        {
          id: 'b-03',
          name: '03_REUNIOES_E_ATAS',
          children: [
            { id: 'b-03-a', name: 'Pautas_e_Anotacoes' },
            { id: 'b-03-b', name: 'Gravacoes_Calls' }
          ]
        },
        {
          id: 'b-04',
          name: '04_PROJETOS_EM_ANDAMENTO',
          tagColor: 'blue',
          children: [
            { id: 'b-04-a', name: 'Sprint_Atual' },
            { id: 'b-04-b', name: 'Backlog_Ideias' }
          ]
        },
        {
          id: 'b-05',
          name: '05_ARQUIVAMENTO',
          tagColor: 'gray',
          children: [
            { id: 'b-05-a', name: 'Projetos_Concluidos' }
          ]
        }
      ]
    }
  },
  {
    id: 'finance-tax',
    title: 'Contabilidade & Organização Financeira',
    category: 'finance',
    description: 'Organização anual estruturada para declaração de IRPF, notas fiscais e controle de despesas.',
    iconName: 'Receipt',
    rootFolder: {
      id: 'root-finance',
      name: 'FINANCEIRO_2026',
      tagColor: 'green',
      isExpanded: true,
      children: [
        {
          id: 'f-01',
          name: '01_NOTAS_FISCAIS',
          tagColor: 'green',
          children: [
            { id: 'f-01-a', name: 'Emitidas' },
            { id: 'f-01-b', name: 'Recebidas_Fornecedores' }
          ]
        },
        {
          id: 'f-02',
          name: '02_EXTRATOS_BANCARIOS',
          children: [
            { id: 'f-02-a', name: 'Conta_Corrente' },
            { id: 'f-02-b', name: 'Cartao_Credito' },
            { id: 'f-02-c', name: 'Investimentos' }
          ]
        },
        {
          id: 'f-03',
          name: '03_IMPOSTOS_E_GUIAS',
          tagColor: 'red',
          children: [
            { id: 'f-03-a', name: 'DARF_e_DAS' },
            { id: 'f-03-b', name: 'GPS_INSS' },
            { id: 'f-03-c', name: 'Declaracao_Anual' }
          ]
        },
        {
          id: 'f-04',
          name: '04_COMPROVANTES_DEDUTIVEIS',
          children: [
            { id: 'f-04-a', name: 'Saude_e_Medicos' },
            { id: 'f-04-b', name: 'Educacao' },
            { id: 'f-04-c', name: 'Previdencia' }
          ]
        }
      ]
    }
  },
  {
    id: 'podcast-audio',
    title: 'Podcast & Gravação de Áudio',
    category: 'all',
    description: 'Estrutura para podcasters e radialistas com separação de áudio cru, efeitos e masters.',
    iconName: 'Mic',
    rootFolder: {
      id: 'root-audio',
      name: 'PODCAST_[EPISODIO]',
      tagColor: 'purple',
      isExpanded: true,
      children: [
        {
          id: 'pod-01',
          name: '01_AUDIO_BRUTO',
          tagColor: 'red',
          children: [
            { id: 'pod-01-a', name: 'Host_Mic' },
            { id: 'pod-01-b', name: 'Convidado_Mic' },
            { id: 'pod-01-c', name: 'Backup_Gravacao' }
          ]
        },
        {
          id: 'pod-02',
          name: '02_TRILHAS_E_VINHETAS',
          children: [
            { id: 'pod-02-a', name: 'Intro_e_Encerramento' },
            { id: 'pod-02-b', name: 'Efeitos_Sonoros' },
            { id: 'pod-02-c', name: 'Musicas_Fundo' }
          ]
        },
        {
          id: 'pod-03',
          name: '03_PROJETOS_DAW',
          tagColor: 'blue',
          children: [
            { id: 'pod-03-a', name: 'Logic_Pro_Session' },
            { id: 'pod-03-b', name: 'Reaper_Audacity' }
          ]
        },
        {
          id: 'pod-04',
          name: '04_EXPORTS_FINAIS',
          tagColor: 'green',
          children: [
            { id: 'pod-04-a', name: 'Master_WAV_Sem_Compressao' },
            { id: 'pod-04-b', name: 'Spotify_MP3_320kbps' },
            { id: 'pod-04-c', name: 'Cortes_Redes_Sociais' }
          ]
        }
      ]
    }
  }
];
