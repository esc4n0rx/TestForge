# Exemplos de Uso - Exportação de Flows

Este documento fornece exemplos práticos de como usar a funcionalidade de exportação de Flows (disponível para planos Team e Enterprise).

---

## 📋 Pré-requisitos

- Plano Team ou Enterprise (feature `flow_export` habilitada)
- Usuário autenticado
- Acesso ao workspace do flow

---

## 🔹 Exportar Flow Único

### Endpoint
```
GET /api/flows/:flowId/export
```

### Query Params — Exportação Individual

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `format` | string | **obrigatório** | Formato de exportação: `pdf` ou `excel` |
| `includeAttachments` | boolean | `true` | Incluir imagens dos anexos nos steps |
| `includeVersionHistory` | boolean | `false` | Incluir histórico de versões (PDF only) |

> ⚠️ Se `format` não for `pdf` ou `excel`, a API retorna **400 INVALID_FORMAT**.

---

### Exemplo 1: PDF com steps e imagens
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123.pdf
```

**Retorna:** Arquivo PDF com cabeçalho visual, informações do flow e steps numerados com imagens renderizadas.

---

### Exemplo 2: PDF com histórico de versões
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf&includeVersionHistory=true' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123-completo.pdf
```

**Retorna:** PDF com informações do flow, steps E histórico de todas as versões.

---

### Exemplo 3: PDF sem imagens
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf&includeAttachments=false' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123-sem-imagens.pdf
```

**Retorna:** PDF sem renderização de imagens nos steps (mais rápido).

---

### Exemplo 4: Excel (.xlsx) — Flow único
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=excel' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123.xlsx
```

**Retorna:** Arquivo `.xlsx` com metadados do flow, cabeçalho estilizado (azul/branco), e uma linha por step com colunas: Step, Tipo, Título, Conteúdo, Observações, Conexões, Anexos.

**Estrutura da planilha:**
```
[Linha 1]   Flow: Nome do Flow          ← título em negrito
[Linha 2]   ID: 123
[Linha 3]   Tipo: Teste (QA)
[Linha 4]   Workspace: Acme Inc
[Linha 5]   Ambiente: Produção
[Linha 6]   Status: Ativo
[Linha 7]   Exportado em: 20/02/2026 ...
[Linha 8]   (espaço)
[Linha 9]   Step | Tipo | Título | Conteúdo | Observações | Conexões | Anexos   ← header azul
[Linha 10+] 1 | Início | ... | ... | ... | ...
            2 | Ação   | ... | ... | ... | ...
```

---

## 🔹 Exportar Múltiplos Flows (Excel)

### Endpoint
```
GET /api/flows/export/multiple
```

### Query Params — Exportação Múltipla

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `flowIds` | string | **obrigatório** | IDs separados por vírgula (ex: `1,2,3`) |

**Retorna sempre `.xlsx`** com:
- Aba **Resumo**: tabela com todos os flows (ID, nome, tipo, ambiente, workspace, template, status, steps)
- Uma aba por flow com seus steps detalhados

---

### Exemplo 5: Exportar Vários Flows
```bash
curl -X GET \
  'http://localhost:3000/api/flows/export/multiple?flowIds=123,124,125' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flows-multiplos.xlsx
```

**Estrutura do arquivo:**
```
Aba "Resumo"
  Flow ID | Nome | Tipo | Ambiente | Workspace | Template | Status | Steps
  123     | ...  | ...  | ...      | ...       | Não      | Ativo  | 12
  124     | ...  | ...  | ...      | ...       | Não      | Ativo  | 8
  125     | ...  | ...  | ...      | ...       | Não      | Ativo  | 15

Aba "Teste de Login-123"
  Step | Tipo | Título | Conteúdo | Observações | Conexões | Anexos
  1    | Início | ...

Aba "Teste de Cadastro-124"
  ...
```

---

## 📦 Usando com JavaScript/TypeScript

### Exemplo 6: Download de PDF com Fetch API

```typescript
async function downloadFlowPDF(flowId: number) {
  const response = await fetch(
    `/api/flows/${flowId}/export?format=pdf&includeVersionHistory=true`,
    {
      method: 'GET',
      credentials: 'include', // Importante para incluir cookies de sessão
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.code);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-${flowId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Uso
downloadFlowPDF(123);
```

---

### Exemplo 7: Download de Excel com Axios

```typescript
import axios from 'axios';
import FileSaver from 'file-saver';

async function downloadFlowExcel(flowId: number) {
  const response = await axios.get(
    `/api/flows/${flowId}/export`,
    {
      params: {
        format: 'excel',
        includeAttachments: true,
      },
      responseType: 'blob',
      withCredentials: true,
    }
  );

  const filename = `flow-${flowId}-${Date.now()}.xlsx`;
  FileSaver.saveAs(response.data, filename);
}

// Uso
downloadFlowExcel(123);
```

---

### Exemplo 8: Exportação Múltipla com React

```typescript
import React from 'react';

interface FlowExportButtonProps {
  flowIds: number[];
}

const FlowExportButton: React.FC<FlowExportButtonProps> = ({ flowIds }) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/flows/export/multiple?flowIds=${flowIds.join(',')}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao exportar flows');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flows-export-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao exportar flows');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Exportando...' : `Exportar ${flowIds.length} flows`}
    </button>
  );
};

export default FlowExportButton;
```

---

## 🎨 Componente Vue.js

### Exemplo 9: Exportação com Vue 3

```vue
<template>
  <div>
    <button
      @click="exportToPDF"
      :disabled="loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Exportando...' : 'Exportar PDF' }}
    </button>

    <button
      @click="exportToExcel"
      :disabled="loading"
      class="btn btn-secondary ml-2"
    >
      {{ loading ? 'Exportando...' : 'Exportar Excel' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  flowId: number;
}

const props = defineProps<Props>();
const loading = ref(false);

const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Erro ao exportar');
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const exportToPDF = async () => {
  loading.value = true;
  try {
    await downloadFile(
      `/api/flows/${props.flowId}/export?format=pdf`,
      `flow-${props.flowId}.pdf`
    );
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao exportar PDF');
  } finally {
    loading.value = false;
  }
};

const exportToExcel = async () => {
  loading.value = true;
  try {
    await downloadFile(
      `/api/flows/${props.flowId}/export?format=excel`,
      `flow-${props.flowId}.xlsx`
    );
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao exportar Excel');
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## ⚠️ Tratamento de Erros

### Possíveis Erros

| Código | Descrição | Status HTTP |
|--------|-----------|-------------|
| `INVALID_FORMAT` | Formato inválido — use `pdf` ou `excel` | 400 |
| `FLOW_NOT_FOUND` | Flow não encontrado | 404 |
| `FORBIDDEN` | Sem acesso ao workspace | 403 |
| `EXPORT_NOT_AVAILABLE` | Plano não permite exportação | 403 |
| `MISSING_FLOW_IDS` | Parâmetro `flowIds` não fornecido | 400 |
| `INVALID_FLOW_IDS` | Nenhum ID válido fornecido | 400 |
| `NO_FLOWS_FOUND` | Nenhum flow encontrado no workspace | 404 |

### Exemplo de Tratamento

```typescript
async function exportFlowWithErrorHandling(flowId: number, format: 'pdf' | 'excel') {
  try {
    const response = await fetch(`/api/flows/${flowId}/export?format=${format}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.error.code) {
        case 'EXPORT_NOT_AVAILABLE':
          alert('Seu plano não permite exportação. Faça upgrade para Team ou Enterprise.');
          break;
        case 'INVALID_FORMAT':
          alert('Formato inválido. Use pdf ou excel.');
          break;
        case 'FLOW_NOT_FOUND':
          alert('Flow não encontrado.');
          break;
        case 'FORBIDDEN':
          alert('Você não tem acesso a este flow.');
          break;
        default:
          alert(`Erro: ${error.error.message}`);
      }
      return;
    }

    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${flowId}.${extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro inesperado:', error);
    alert('Erro inesperado ao exportar flow');
  }
}
```

---

## 📊 Conteúdo dos Exports

### PDF Inclui:
- ✅ Cabeçalho visual escuro com nome do flow
- ✅ Informações completas (ID, tipo, ambiente, workspace, space, status, criado por, etc)
- ✅ Steps numerados com bloco de cabeçalho azul por step
- ✅ Imagens dos anexos renderizadas inline (com fallback se indisponível)
- ✅ Tamanho e nome de cada arquivo anexado
- ✅ Rodapé com data de exportação e número de página (ex: `Página 2 de 5`)
- ✅ Paginação automática

### Excel (.xlsx) — Flow único inclui:
- ✅ Metadados do flow (ID, tipo, workspace, ambiente, status, exportado em)
- ✅ Cabeçalho de colunas em negrito branco com fundo azul (`#2d3561`)
- ✅ Uma linha por step com: Step, Tipo, Título, Conteúdo, Observações, Conexões, Anexos
- ✅ Linhas alternadas com fundo cinza suave
- ✅ Linha de cabeçalho congelada para rolagem
- ✅ Larguras de coluna otimizadas

### Excel (.xlsx) — Múltiplos flows inclui:
- ✅ Aba **Resumo** com todos os flows exportados
- ✅ Uma aba por flow com seus steps detalhados
- ✅ Nome da aba = nome do flow + ID (máx 31 caracteres — limite do Excel)

---

## 💡 Dicas

1. **Performance**: Exportação PDF de flows com muitas imagens pode demorar alguns segundos (download das imagens). Mostre um loading para o usuário.

2. **Imagens no PDF**: O backend tenta baixar cada imagem antes de gerar o PDF. Se uma imagem não puder ser baixada (timeout de 8s, URL inválida, etc), ela é exibida como `[Imagem: nome-do-arquivo]` sem interromper o export.

3. **Filename**: O backend gera automaticamente um nome de arquivo único com timestamp. Você pode customizar o nome no frontend.

4. **Batch Export**: Para exportar muitos flows, use a rota `/export/multiple` que gera um único `.xlsx` com aba de resumo.

5. **PDF vs Excel**:
   - Use **PDF** para documentação visual, apresentações e compliance
   - Use **Excel** para análise de dados, importação em ferramentas externas e edição

---

## 🎯 Casos de Uso

### 1. Documentação de Testes
Exportar flows de teste em PDF com imagens de evidência para documentação de QA ou compliance.

### 2. Análise de Dados
Exportar em Excel para análise de complexidade de flows (quantidade de steps, tipos de cards, etc).

### 3. Apresentação
Exportar em PDF para apresentar flows para stakeholders.

### 4. Backup em Planilha
Exportar múltiplos flows em Excel para backup estruturado de dados.

### 5. Relatório de Sprint
Exportar todos os flows de um workspace em um único `.xlsx` para relatório de sprint.

---

**Desenvolvido com:** pdfkit, exceljs
**Disponível em:** Forge Team e Forge Enterprise
