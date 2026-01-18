# Exemplos de Uso - Exportação de Flows

Este documento fornece exemplos práticos de como usar a funcionalidade de exportação de Flows (disponível para planos Team e Enterprise).

---

## 📋 Pré-requisitos

- Plano Team ou Enterprise (feature `flow_export` habilitada)
- Usuário autenticado
- Acesso ao workspace do flow

---

## 🔹 Exportar Flow Único para PDF

### Endpoint
```
GET /api/flows/:flowId/export
```

### Exemplo 1: PDF Básico
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123.pdf
```

**Retorna:** Arquivo PDF com informações do flow e cards

---

### Exemplo 2: PDF Completo (com histórico de versões)
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf&includeVersionHistory=true' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123-completo.pdf
```

**Retorna:** PDF com informações do flow, cards E histórico de todas as versões

---

### Exemplo 3: PDF Sem Anexos
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=pdf&includeAttachments=false' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123-sem-anexos.pdf
```

**Retorna:** PDF sem informações de anexos dos cards

---

## 🔹 Exportar Flow Único para CSV

### Exemplo 4: CSV Básico
```bash
curl -X GET \
  'http://localhost:3000/api/flows/123/export?format=csv' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flow-123.csv
```

**Retorna:** Arquivo CSV com uma linha por card

**Formato do CSV:**
```csv
Flow ID,Flow Nome,Flow Tipo,Flow Ambiente,Workspace,Space,Template,Versão Atual,Card ID,Card Tipo,Card Título,Card Conteúdo,Card Notas,Card Conexões,Anexos
123,Teste de Login,Teste (QA),Nenhum,Acme Inc,Mobile Tests,Não,v2,456,Início,Iniciar teste,,,,
123,Teste de Login,Teste (QA),Nenhum,Acme Inc,Mobile Tests,Não,v2,457,Ação,Abrir app,Abrir aplicativo na tela inicial,Aguardar 3 segundos,,2 anexo(s)
```

---

## 🔹 Exportar Múltiplos Flows para CSV

### Endpoint
```
GET /api/flows/export/multiple
```

### Exemplo 5: Exportar Vários Flows (Resumo)
```bash
curl -X GET \
  'http://localhost:3000/api/flows/export/multiple?flowIds=123,124,125' \
  -H 'Cookie: testforge.sid=your-session-cookie' \
  --output flows-multiplos.csv
```

**Retorna:** CSV com uma linha por flow (resumo)

**Formato do CSV:**
```csv
Flow ID,Flow Nome,Flow Tipo,Flow Ambiente,Workspace,Template,Status,Versões,Cards
123,Teste de Login,Teste (QA),Nenhum,Acme Inc,Não,Ativo,3,12
124,Teste de Cadastro,Teste (QA),Nenhum,Acme Inc,Não,Ativo,2,8
125,Fluxo de Checkout,Processo,Produção,Acme Inc,Não,Ativo,1,15
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
    throw new Error('Erro ao exportar flow');
  }

  // Criar blob do PDF
  const blob = await response.blob();

  // Criar link de download
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

### Exemplo 7: Download de CSV com Axios

```typescript
import axios from 'axios';
import FileSaver from 'file-saver';

async function downloadFlowCSV(flowId: number) {
  const response = await axios.get(
    `/api/flows/${flowId}/export`,
    {
      params: {
        format: 'csv',
        includeCards: true,
        includeAttachments: true,
      },
      responseType: 'blob',
      withCredentials: true,
    }
  );

  // Salvar arquivo
  const filename = `flow-${flowId}-${Date.now()}.csv`;
  FileSaver.saveAs(response.data, filename);
}

// Uso
downloadFlowCSV(123);
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
      a.download = `flows-export-${Date.now()}.csv`;
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
      @click="exportToCSV"
      :disabled="loading"
      class="btn btn-secondary ml-2"
    >
      {{ loading ? 'Exportando...' : 'Exportar CSV' }}
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

const exportToCSV = async () => {
  loading.value = true;
  try {
    await downloadFile(
      `/api/flows/${props.flowId}/export?format=csv`,
      `flow-${props.flowId}.csv`
    );
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao exportar CSV');
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 🔧 Parâmetros de Query

### Exportação Individual

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `format` | string | `pdf` | Formato de exportação: `pdf` ou `csv` |
| `includeCards` | boolean | `true` | Incluir cards no export |
| `includeAttachments` | boolean | `true` | Incluir informações de anexos |
| `includeVersionHistory` | boolean | `false` | Incluir histórico de versões (PDF only) |

### Exportação Múltipla

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `flowIds` | string | - | **Obrigatório**. IDs separados por vírgula (ex: `1,2,3`) |

---

## ⚠️ Tratamento de Erros

### Possíveis Erros

| Código | Descrição | Status HTTP |
|--------|-----------|-------------|
| `FLOW_NOT_FOUND` | Flow não encontrado | 404 |
| `FORBIDDEN` | Sem acesso ao workspace | 403 |
| `EXPORT_NOT_AVAILABLE` | Plano não permite exportação | 403 |
| `INVALID_FORMAT` | Formato inválido (não pdf nem csv) | 400 |
| `MISSING_FLOW_IDS` | Parâmetro flowIds não fornecido | 400 |
| `INVALID_FLOW_IDS` | Nenhum ID válido fornecido | 400 |
| `NO_FLOWS_FOUND` | Nenhum flow encontrado | 404 |

### Exemplo de Tratamento

```typescript
async function exportFlowWithErrorHandling(flowId: number) {
  try {
    const response = await fetch(`/api/flows/${flowId}/export?format=pdf`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.error.code) {
        case 'EXPORT_NOT_AVAILABLE':
          alert('Seu plano não permite exportação. Faça upgrade para Team ou Enterprise.');
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

    // Download do arquivo
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${flowId}.pdf`;
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
- ✅ Cabeçalho formatado com título do flow
- ✅ Informações completas (ID, nome, tipo, ambiente, workspace, etc)
- ✅ Descrição do flow
- ✅ Lista de cards com:
  - Tipo do card
  - Título
  - Conteúdo
  - Observações
  - Conexões
  - Anexos (nome e tamanho)
- ✅ Histórico de versões (se solicitado)
- ✅ Rodapé com data de exportação
- ✅ Paginação automática

### CSV Inclui:
- ✅ Informações do flow em cada linha
- ✅ Informações de cada card
- ✅ Formato compatível com Excel/Google Sheets
- ✅ Encoding UTF-8

---

## 💡 Dicas

1. **Performance**: Exportação de flows grandes (muitos cards) pode demorar alguns segundos. Mostre um loading para o usuário.

2. **Cache**: Considere cachear exports temporariamente no frontend se o mesmo flow for exportado múltiplas vezes.

3. **Filename**: O backend gera automaticamente um nome de arquivo único com timestamp. Você pode customizar o nome no frontend.

4. **Batch Export**: Para exportar muitos flows, use a rota `/export/multiple` que é mais eficiente.

5. **PDF vs CSV**:
   - Use **PDF** para documentação visual e apresentações
   - Use **CSV** para análise de dados e importação em planilhas

---

## 🎯 Casos de Uso

### 1. Documentação de Testes
Exportar flows de teste em PDF para documentação de QA ou compliance.

### 2. Backup
Exportar todos os flows em CSV para backup dos dados.

### 3. Análise
Exportar em CSV para análise de métricas (quantidade de cards, complexidade, etc).

### 4. Apresentação
Exportar em PDF para apresentar flows para stakeholders.

### 5. Migração
Exportar em CSV para migração entre workspaces ou sistemas.

---

**Desenvolvido com:** pdfkit, csv-stringify
**Disponível em:** Forge Team e Forge Enterprise
