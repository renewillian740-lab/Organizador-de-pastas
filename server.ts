import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', macApp: 'Organizador Automático de Pastas' });
});

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// AI endpoint to design intelligent folder structures
app.post('/api/ai/suggest-structure', async (req, res) => {
  const { prompt, industry, baseName } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getGenAI();
  if (!ai) {
    // Graceful fallback structure generator if no API key is provided
    return res.json({
      success: true,
      fromAi: false,
      rootName: baseName || 'Novo Projeto Mac',
      nodes: [
        { name: '01_Entrada_Bruto', tag: 'blue', children: [{ name: 'Arquivos_Recebidos' }, { name: 'Notas_e_Briefing' }] },
        { name: '02_Trabalho_Ativo', tag: 'orange', children: [{ name: 'Arquivos_Fonte' }, { name: 'Rascunhos' }, { name: 'Assets' }] },
        { name: '03_Revisao', tag: 'purple', children: [{ name: 'Versao_Cliente' }, { name: 'Feedbacks' }] },
        { name: '04_Entregas_Finais', tag: 'green', children: [{ name: 'Exportados' }, { name: 'Arquivamento' }] },
        { name: '05_Documentos', tag: 'gray', children: [{ name: 'Contratos_e_NF' }, { name: 'Cronograma' }] }
      ]
    });
  }

  try {
    const systemPrompt = `Você é um arquiteto especialista em organização de sistemas de arquivos para macOS Finder.
O usuário quer criar uma árvore de pastas automática para: "${prompt}".
Contexto/Área: "${industry || 'Geral'}".
Nome base sugerido: "${baseName || 'Projeto'}".

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "rootName": "NomeDaPastaPrincipal",
  "nodes": [
    {
      "name": "01_NomeDaPasta",
      "tag": "blue|green|orange|purple|red|yellow|gray" (opcional, cor do Finder),
      "children": [
        {
          "name": "Subpasta",
          "children": [...]
        }
      ]
    }
  ]
}
Regras:
1. Nomes adequados para macOS Finder (limpos, sem caracteres ilegais como : ou /, preferencialmente usando underscores ou hifens ou espaços limpos e prefixos numéricos como 01_, 02_ para manter a ordem no Finder).
2. Não inclua Markdown em torno do JSON se possível, ou retorne apenas o bloco json.
3. Máximo de 3 a 4 níveis de profundidade, muito prático e profissional para o nicho solicitado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      fromAi: true,
      rootName: parsed.rootName || baseName || 'Novo Projeto Mac',
      nodes: parsed.nodes || []
    });
  } catch (err: any) {
    console.error('Error generating AI structure:', err);
    // Fallback response
    return res.json({
      success: true,
      fromAi: false,
      rootName: baseName || 'Novo Projeto Mac',
      nodes: [
        { name: '01_Planejamento', tag: 'blue', children: [{ name: 'Briefing' }, { name: 'Referencias' }] },
        { name: '02_Producao', tag: 'orange', children: [{ name: 'Arquivos_Base' }, { name: 'Em_Andamento' }] },
        { name: '03_Entregas', tag: 'green', children: [{ name: 'Versao_Final' }, { name: 'Aprovados' }] }
      ]
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mac Folder Automator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
