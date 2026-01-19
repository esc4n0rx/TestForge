# Guia de Integracao Frontend - Flows

Este documento explica como integrar o frontend com a API de Flows do TestForge.

## Indice

1. [Estrutura de Dados](#estrutura-de-dados)
2. [Helpers Recomendados](#helpers-recomendados)
3. [Exemplos de Integracao](#exemplos-de-integracao)
4. [Limites por Plano](#limites-por-plano)
5. [Tipos de Cards](#tipos-de-cards)
6. [Fluxo de Criacao de Flow](#fluxo-de-criacao-de-flow)
7. [Status do Flow](#status-do-flow)
8. [Templates](#templates)
9. [Tratamento de Erros](#tratamento-de-erros)

---

## Estrutura de Dados

### Flow

```typescript
interface Flow {
  id: number;
  workspaceId: number;
  spaceId: number | null;
  name: string;
  description: string | null;
  type: 'TEST' | 'PROGRAM_FLOW' | 'PROCESS';
  environment: 'NONE' | 'DEV' | 'QA' | 'STAGING' | 'PRODUCTION';
  isTemplate: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;

  // Relacoes incluidas
  workspace: { id: number; name: string; slug: string };
  space: { id: number; name: string } | null;
  creator: { id: number; nome: string; email: string };
  version: FlowVersion | null;  // Versao unica do flow
}
```

### FlowVersion

```typescript
interface FlowVersion {
  id: number;
  flowId: number;
  status: 'DRAFT' | 'ACTIVE' | 'DELETED';
  createdBy: number;
  createdAt: string;

  // Cards incluidos quando busca flow
  cards?: FlowCard[];
}
```

### FlowCard

```typescript
interface FlowCard {
  id: number;
  versionId: number;
  type: CardType;
  title: string | null;
  content: string | null;
  notes: string | null;
  positionX: number;
  positionY: number;
  connections: string;  // JSON string de array de IDs
  createdAt: string;

  // Incluido quando buscado com attachments
  attachments?: FlowAttachment[];
}

type CardType =
  | 'START' | 'END'
  | 'ACTION' | 'EVENT'
  | 'DECISION' | 'ASSERT'
  | 'EVIDENCE' | 'ERROR'
  | 'CONDITION' | 'LOOP' | 'STATE'
  | 'COMMENT' | 'TECH_NOTE';
```

---

## Helpers Recomendados

Crie estes helpers no seu projeto:

```typescript
// helpers/flow.ts

/**
 * Obtem a versao de um flow
 */
export function getFlowVersion(flow: Flow): FlowVersion | null {
  return flow.version || null;
}

/**
 * Obtem os cards de um flow
 */
export function getFlowCards(flow: Flow): FlowCard[] {
  return flow.version?.cards || [];
}

/**
 * Verifica se o flow esta ativo (pode ser executado)
 */
export function isFlowActive(flow: Flow): boolean {
  return flow.version?.status === 'ACTIVE';
}

/**
 * Verifica se o flow pode ser editado (apenas DRAFT)
 */
export function canEditFlow(flow: Flow): boolean {
  return flow.version?.status === 'DRAFT';
}

/**
 * Verifica se o flow esta deletado
 */
export function isFlowDeleted(flow: Flow): boolean {
  return flow.version?.status === 'DELETED';
}

/**
 * Parseia o campo connections de um card
 */
export function parseConnections(card: FlowCard): number[] {
  try {
    return JSON.parse(card.connections || '[]');
  } catch {
    return [];
  }
}

/**
 * Verifica se um tipo de card e permitido para um tipo de flow
 */
export function isCardTypeAllowed(flowType: string, cardType: CardType): boolean {
  const testOnly = ['ASSERT', 'EVIDENCE', 'ERROR'];
  const programFlowOnly = ['CONDITION', 'LOOP', 'STATE'];

  if (testOnly.includes(cardType)) {
    return flowType === 'TEST';
  }

  if (programFlowOnly.includes(cardType)) {
    return flowType === 'PROGRAM_FLOW';
  }

  return true; // Cards comuns sao permitidos em todos
}

/**
 * Obtem tipos de cards disponiveis para um tipo de flow
 */
export function getAvailableCardTypes(flowType: string): CardType[] {
  const common: CardType[] = ['START', 'END', 'ACTION', 'EVENT', 'DECISION', 'COMMENT', 'TECH_NOTE'];

  switch (flowType) {
    case 'TEST':
      return [...common, 'ASSERT', 'EVIDENCE', 'ERROR'];
    case 'PROGRAM_FLOW':
      return [...common, 'CONDITION', 'LOOP', 'STATE'];
    case 'PROCESS':
    default:
      return common;
  }
}
```

---

## Exemplos de Integracao

### Listar Flows

```typescript
async function listFlows(filters?: {
  type?: 'TEST' | 'PROGRAM_FLOW' | 'PROCESS';
  isTemplate?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.isTemplate !== undefined) params.append('isTemplate', String(filters.isTemplate));

  const response = await fetch(`/api/flows?${params}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data.flows;
}

// Uso
const flows = await listFlows({ type: 'PROCESS' });
flows.forEach(flow => {
  const version = flow.version;
  console.log(`${flow.name} - Status: ${version?.status}`);
});
```

### Criar Flow

```typescript
async function createFlow(data: {
  name: string;
  description?: string;
  type: 'TEST' | 'PROGRAM_FLOW' | 'PROCESS';
  isTemplate?: boolean;
}) {
  const response = await fetch('/api/flows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.code);
  }

  const flow = result.data.flow;

  // A versao ja vem criada automaticamente com o flow
  console.log(`Flow criado: ${flow.id}`);
  console.log(`Status: ${flow.version?.status}`); // DRAFT

  return flow;
}

// Uso
const flow = await createFlow({
  name: 'Meu Flow',
  type: 'PROCESS',
});
```

### Adicionar Card

```typescript
async function addCard(flowId: number, card: {
  type: CardType;
  title?: string;
  content?: string;
  notes?: string;
  positionX?: number;
  positionY?: number;
  connections?: number[];
}) {
  const response = await fetch(`/api/flows/${flowId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.code);
  }

  return result.data.card;
}

// Uso
const card = await addCard(flow.id, {
  type: 'START',
  title: 'Inicio do Processo',
  content: 'Descricao do primeiro passo',
  positionX: 100,
  positionY: 50,
});
```

### Atualizar Card

```typescript
async function updateCard(cardId: number, updates: {
  title?: string;
  content?: string;
  notes?: string;
  positionX?: number;
  positionY?: number;
  connections?: number[];
}) {
  const response = await fetch(`/api/flows/cards/${cardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.code);
  }

  return result.data.card;
}
```

### Ativar/Desativar Flow

```typescript
// Ativar flow (muda status para ACTIVE)
async function activateFlow(flowId: number) {
  const response = await fetch(`/api/flows/${flowId}/activate`, {
    method: 'POST',
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.code);
  }

  return result.data.flow;
}

// Desativar flow (muda status para DRAFT)
async function deactivateFlow(flowId: number) {
  const response = await fetch(`/api/flows/${flowId}/deactivate`, {
    method: 'POST',
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error.code);
  }

  return result.data.flow;
}
```

### Fluxo Completo de Criacao

```typescript
async function createCompleteFlow() {
  // 1. Criar flow
  const flow = await createFlow({
    name: 'Processo de Compra',
    description: 'Fluxo para criar pedido de compra',
    type: 'PROCESS',
  });

  // 2. Adicionar cards
  const startCard = await addCard(flow.id, {
    type: 'START',
    title: 'Inicio',
    positionX: 100,
    positionY: 50,
  });

  const actionCard = await addCard(flow.id, {
    type: 'ACTION',
    title: 'Preencher Formulario',
    content: 'Inserir dados do pedido',
    positionX: 100,
    positionY: 150,
    connections: [startCard.id],
  });

  const endCard = await addCard(flow.id, {
    type: 'END',
    title: 'Fim',
    positionX: 100,
    positionY: 250,
    connections: [actionCard.id],
  });

  // 3. Ativar flow quando pronto
  const activatedFlow = await activateFlow(flow.id);

  return activatedFlow;
}
```

---

## Limites por Plano

### Forge Start

```typescript
const START_LIMITS = {
  max_flows: 10,           // Maximo de flows ativos
  flow_templates: 5,       // Maximo de templates
  flow_export: false,      // SEM exportacao
  flow_environments: false,// SEM ambientes
  flow_execution_logs: false, // SEM logs de execucao
};
```

### Forge Team

```typescript
const TEAM_LIMITS = {
  max_flows: -1,           // Ilimitado
  flow_templates: -1,      // Ilimitado
  flow_export: true,       // COM exportacao
  flow_environments: false,// SEM ambientes
  flow_execution_logs: true, // COM logs
};
```

### Forge Enterprise

```typescript
const ENTERPRISE_LIMITS = {
  max_flows: -1,
  flow_templates: -1,
  flow_export: true,
  flow_environments: true, // COM ambientes
  flow_execution_logs: true,
};
```

### Verificar Feature no Frontend

```typescript
function checkFeature(subscription: any, feature: string): boolean {
  // Buscar valor da feature no plano
  const planFeature = subscription.plan.features.find(f => f.code === feature);

  if (!planFeature) return false;

  // Feature booleana
  if (planFeature.type === 'BOOLEAN') {
    return planFeature.value === 'true';
  }

  // Feature numerica
  if (planFeature.type === 'NUMERIC') {
    const limit = parseInt(planFeature.value);
    return limit === -1 || limit > 0;
  }

  return false;
}
```

---

## Tipos de Cards

### Cards Universais (todos os tipos de flow)

| Tipo | Descricao | Uso |
|------|-----------|-----|
| START | Inicio do flow | Ponto de entrada |
| END | Fim do flow | Ponto de saida |
| ACTION | Acao a ser executada | Passo do processo |
| EVENT | Evento do sistema | Trigger ou notificacao |
| DECISION | Ponto de decisao | Bifurcacao no flow |
| COMMENT | Comentario | Documentacao |
| TECH_NOTE | Nota tecnica | Info para desenvolvedores |

### Cards Exclusivos - TEST

| Tipo | Descricao |
|------|-----------|
| ASSERT | Validacao/Afirmacao |
| EVIDENCE | Evidencia (screenshot, etc) |
| ERROR | Registro de erro esperado |

### Cards Exclusivos - PROGRAM_FLOW

| Tipo | Descricao |
|------|-----------|
| CONDITION | Condicional (IF/ELSE) |
| LOOP | Loop (FOR/WHILE) |
| STATE | Estado do sistema |

---

## Status do Flow

### Estados Disponiveis

- **DRAFT**: Flow editavel, NAO pode ser executado
- **ACTIVE**: Flow executavel, NAO pode ser editado
- **DELETED**: Flow marcado como deletado (soft delete)

### Transicoes

```
DRAFT -> ACTIVE   (via POST /api/flows/:flowId/activate)
ACTIVE -> DRAFT   (via POST /api/flows/:flowId/deactivate)
* -> DELETED      (via DELETE /api/flows/:flowId)
```

### Regras de Negocio

1. **DRAFT**:
   - Pode adicionar/editar/remover cards
   - NAO pode ser executado

2. **ACTIVE**:
   - NAO pode editar cards
   - Pode ser executado
   - Conta no limite de flows ativos

3. **DELETED**:
   - Soft delete (dados preservados)
   - NAO aparece em listagens normais

---

## Templates

### Criar Template

```typescript
const template = await createFlow({
  name: 'Template Pedido de Compra',
  type: 'PROCESS',
  isTemplate: true,  // Marca como template
});
```

### Criar Flow de Template

```typescript
async function createFromTemplate(templateId: number, name?: string) {
  const response = await fetch(`/api/flows/templates/${templateId}/create-flow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  return (await response.json()).data.flow;
}

// Uso
const newFlow = await createFromTemplate(templateId, 'Pedido - Filial SP');
```

### Listar Templates

```typescript
const templates = await listFlows({ isTemplate: true });
```

---

## Tratamento de Erros

### Codigos de Erro Comuns

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  FLOW_NOT_FOUND: 'Flow nao encontrado',
  CARD_NOT_FOUND: 'Card nao encontrado',
  FORBIDDEN: 'Sem permissao para esta acao',
  ENVIRONMENTS_NOT_AVAILABLE: 'Ambientes nao disponiveis no seu plano',
  TEMPLATE_LIMIT_EXCEEDED: 'Limite de templates atingido',
  ACTIVE_FLOW_LIMIT_EXCEEDED: 'Limite de flows ativos atingido',
  CANNOT_EDIT_ACTIVE_FLOW: 'Nao e possivel editar um flow ativo',
  CARD_TYPE_NOT_ALLOWED_FOR_FLOW_TYPE: 'Tipo de card nao permitido para este tipo de flow',
  FLOW_NOT_ACTIVE: 'Flow nao esta ativo',
  CANNOT_EXECUTE_TEMPLATE: 'Templates nao podem ser executados',
};

function handleError(error: any) {
  const code = error.message || error.code;
  const message = ERROR_MESSAGES[code] || 'Erro desconhecido';

  // Mostrar mensagem ao usuario
  toast.error(message);
}
```

### Exemplo de Hook React

```typescript
function useFlows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = async (filters?: any) => {
    setLoading(true);
    setError(null);

    try {
      const data = await listFlows(filters);
      setFlows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNewFlow = async (data: any) => {
    try {
      const flow = await createFlow(data);
      setFlows(prev => [flow, ...prev]);
      return flow;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    flows,
    loading,
    error,
    fetchFlows,
    createNewFlow,
    // Helpers
    isFlowActive,
    canEditFlow,
    getFlowCards,
  };
}
```

---

## Checklist de Integracao

- [ ] Criar helper para obter versao (`flow.version`)
- [ ] Criar helper para obter cards (`flow.version?.cards`)
- [ ] Criar helper para parsear `connections` (JSON string -> array)
- [ ] Tratar erro 403 para features bloqueadas por plano
- [ ] Mostrar tipos de cards corretos baseado no tipo de flow
- [ ] Verificar permissoes do usuario (OWNER > ADMIN > MEMBER)
- [ ] Bloquear edicao de flows ACTIVE
- [ ] Validar limites do plano antes de ativar flows
- [ ] Usar rotas corretas para cards: `POST /api/flows/:flowId/cards`
