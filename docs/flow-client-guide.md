# TestForge - Guia do Portal do Cliente

## Visao Geral

O Portal do Cliente do TestForge permite que clientes externos acessem e executem flows compartilhados pela sua empresa. Este documento explica como integrar o portal do cliente no frontend.

---

## Metodos de Acesso

Existem duas formas de um cliente acessar flows:

### 1. Acesso via Token (Link Direto)

- Cliente recebe um link unico: `https://app.testforge.com/flow-use/{token}`
- Nao requer login
- Ideal para compartilhamentos pontuais
- Token tem data de expiracao configuravel

### 2. Portal do Cliente (Login)

- Cliente acessa `/client/login`
- Faz login com: workspace slug + email + senha
- Visualiza todos os flows disponiveis
- Acessa historico de execucoes

---

## Autenticacao do Cliente

### Login

```typescript
interface ClientLoginRequest {
  workspaceSlug: string;  // Identificador unico do workspace
  email: string;          // Email do cliente
  senha: string;          // Senha do cliente
}

interface ClientLoginResponse {
  success: true;
  data: {
    client: {
      id: number;
      name: string;
      email: string;
      company: string;
      isActive: boolean;
    };
    workspace: {
      id: number;
      name: string;
      slug: string;
    };
    message: string;
  };
}

// Exemplo de implementacao
async function clientLogin(workspaceSlug: string, email: string, senha: string) {
  const response = await fetch('/api/client-auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // IMPORTANTE: Para cookies de sessao
    body: JSON.stringify({ workspaceSlug, email, senha })
  });

  const data = await response.json();

  if (!data.success) {
    // Tratar erros
    switch (data.error.code) {
      case 'WORKSPACE_NOT_FOUND':
        throw new Error('Empresa nao encontrada');
      case 'WORKSPACE_INACTIVE':
        throw new Error('Empresa inativa');
      case 'INVALID_CREDENTIALS':
        throw new Error('Email ou senha invalidos');
      default:
        throw new Error('Erro ao fazer login');
    }
  }

  return data.data;
}
```

### Verificar Sessao

```typescript
async function getClientSession(): Promise<ClientSession | null> {
  try {
    const response = await fetch('/api/client-auth/me', {
      credentials: 'include'
    });

    const data = await response.json();

    if (!data.success) {
      return null;  // Nao autenticado
    }

    return data.data;
  } catch {
    return null;
  }
}
```

### Logout

```typescript
async function clientLogout() {
  await fetch('/api/client-auth/logout', {
    method: 'POST',
    credentials: 'include'
  });

  // Redirecionar para login
  window.location.href = '/client/login';
}
```

### Alterar Senha

```typescript
async function changePassword(currentPassword: string, newPassword: string) {
  const response = await fetch('/api/client-auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await response.json();

  if (!data.success && data.error.code === 'INVALID_CURRENT_PASSWORD') {
    throw new Error('Senha atual incorreta');
  }

  return data;
}
```

---

## Listando Flows Disponiveis

Apos o login, o cliente pode ver todos os flows que foram compartilhados com ele:

```typescript
interface ClientFlow {
  id: number;
  name: string;
  description: string;
  type: 'TEST' | 'PROGRAM_FLOW' | 'PROCESS';
  isActive: boolean;
  session: {
    id: number;
    token: string;
    expiresAt: string;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  };
}

async function getAvailableFlows(): Promise<ClientFlow[]> {
  const response = await fetch('/api/client-auth/flows', {
    credentials: 'include'
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao carregar flows');
  }

  // IMPORTANTE: Verificar se sessao ainda esta ativa
  return data.data.flows.filter(flow => {
    const expired = new Date(flow.session.expiresAt) < new Date();
    return flow.session.status === 'ACTIVE' && !expired;
  });
}
```

---

## Acesso via Token

Para acesso direto sem login:

```typescript
interface TokenFlowAccess {
  session: {
    id: number;
    token: string;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    expiresAt: string;
  };
  flow: {
    id: number;
    name: string;
    description: string;
    type: string;
    currentVersion: {
      id: number;
      status: string;
      cards: FlowCard[];
    };
  };
  client: {
    id: number;
    name: string;
  };
  workspace: {
    name: string;
  };
}

async function accessFlowByToken(token: string): Promise<TokenFlowAccess> {
  const response = await fetch(`/api/flow-use/${token}`);
  const data = await response.json();

  if (!data.success) {
    switch (data.error.code) {
      case 'SESSION_NOT_FOUND':
        throw new Error('Link invalido ou nao encontrado');
      case 'SESSION_EXPIRED':
        throw new Error('Este link expirou');
      case 'SESSION_REVOKED':
        throw new Error('Este acesso foi revogado');
      case 'FLOW_NOT_ACTIVE':
        throw new Error('Flow nao esta disponivel');
      default:
        throw new Error('Erro ao acessar flow');
    }
  }

  return data.data;
}
```

---

## Executando um Flow

### Iniciar Execucao

```typescript
interface FlowExecution {
  id: number;
  flowId: number;
  versionId: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  notes: string;
}

async function startFlowExecution(token: string, notes?: string): Promise<FlowExecution> {
  const response = await fetch(`/api/flow-use/${token}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || '' })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao iniciar execucao');
  }

  return data.data.execution;
}
```

### Atualizar Status de Card

Durante a execucao, o cliente atualiza o status de cada card:

```typescript
type CardStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED';

interface CardExecutionUpdate {
  status: CardStatus;
  notes?: string;
  attachments?: string[];  // URLs de evidencias
}

async function updateCardExecution(
  executionId: number,
  cardId: number,
  update: CardExecutionUpdate
) {
  const response = await fetch(
    `/api/flow-use/executions/${executionId}/cards/${cardId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao atualizar card');
  }

  return data.data.cardExecution;
}
```

### Finalizar Execucao

```typescript
type ExecutionResult = 'COMPLETED' | 'FAILED';

async function completeExecution(
  executionId: number,
  status: ExecutionResult,
  notes?: string
) {
  const response = await fetch(
    `/api/flow-use/executions/${executionId}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao finalizar execucao');
  }

  return data.data.execution;
}
```

---

## Historico de Execucoes

O cliente pode ver o historico de todas as suas execucoes:

```typescript
interface ExecutionHistory {
  id: number;
  flowId: number;
  flowName: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  notes: string;
}

async function getExecutionHistory(): Promise<ExecutionHistory[]> {
  const response = await fetch('/api/client-auth/executions', {
    credentials: 'include'
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao carregar historico');
  }

  return data.data.executions;
}
```

### Detalhes de uma Execucao

```typescript
interface ExecutionDetail {
  id: number;
  flowId: number;
  versionId: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  notes: string;
  cardExecutions: Array<{
    id: number;
    cardId: number;
    status: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED';
    notes: string;
    executedAt: string;
  }>;
}

async function getExecutionDetails(executionId: number): Promise<ExecutionDetail> {
  const response = await fetch(`/api/flow-use/executions/${executionId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error('Execucao nao encontrada');
  }

  return data.data.execution;
}
```

---

## Componente de Execucao de Flow

Exemplo de implementacao React para executar um flow:

```tsx
import React, { useState, useEffect } from 'react';

interface FlowExecutorProps {
  token: string;
}

export function FlowExecutor({ token }: FlowExecutorProps) {
  const [flowData, setFlowData] = useState<TokenFlowAccess | null>(null);
  const [execution, setExecution] = useState<FlowExecution | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar flow
  useEffect(() => {
    async function loadFlow() {
      try {
        const data = await accessFlowByToken(token);
        setFlowData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFlow();
  }, [token]);

  // Iniciar execucao
  const handleStart = async () => {
    if (!flowData) return;

    try {
      const exec = await startFlowExecution(token, 'Execucao iniciada pelo cliente');
      setExecution(exec);
    } catch (err) {
      setError(err.message);
    }
  };

  // Atualizar card
  const handleCardUpdate = async (cardId: number, status: CardStatus, notes?: string) => {
    if (!execution) return;

    try {
      await updateCardExecution(execution.id, cardId, { status, notes });
      setCardStatuses(prev => ({ ...prev, [cardId]: status }));
      setCurrentCardIndex(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Finalizar execucao
  const handleComplete = async () => {
    if (!execution) return;

    const allPassed = Object.values(cardStatuses).every(s => s === 'PASSED' || s === 'SKIPPED');
    const status = allPassed ? 'COMPLETED' : 'FAILED';

    try {
      await completeExecution(execution.id, status, 'Execucao finalizada');
      // Redirecionar ou mostrar resumo
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!flowData) return <div>Flow nao encontrado</div>;

  const cards = flowData.flow.currentVersion.cards;
  const currentCard = cards[currentCardIndex];

  return (
    <div className="flow-executor">
      <header>
        <h1>{flowData.flow.name}</h1>
        <p>{flowData.flow.description}</p>
        <span>Empresa: {flowData.workspace.name}</span>
      </header>

      {!execution ? (
        <button onClick={handleStart}>Iniciar Execucao</button>
      ) : currentCardIndex < cards.length ? (
        <div className="card-executor">
          <h2>Passo {currentCardIndex + 1} de {cards.length}</h2>
          <div className="card">
            <h3>{currentCard.title}</h3>
            <p>{currentCard.content}</p>
          </div>
          <div className="actions">
            <button onClick={() => handleCardUpdate(currentCard.id, 'PASSED')}>
              Concluido
            </button>
            <button onClick={() => handleCardUpdate(currentCard.id, 'FAILED')}>
              Falhou
            </button>
            <button onClick={() => handleCardUpdate(currentCard.id, 'SKIPPED')}>
              Pular
            </button>
          </div>
        </div>
      ) : (
        <div className="completion">
          <h2>Execucao Concluida!</h2>
          <button onClick={handleComplete}>Finalizar</button>
        </div>
      )}
    </div>
  );
}
```

---

## Administracao de Sessoes (Para Usuarios Internos)

Os administradores do workspace podem gerenciar sessoes de clientes:

### Criar Sessao de Flow para Cliente

```typescript
interface CreateSessionRequest {
  flowId: number;
  clientId: number;
  expiresAt?: string;  // ISO date
}

interface FlowSession {
  id: number;
  token: string;
  flowId: number;
  clientId: number;
  workspaceId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
}

async function createFlowSession(
  workspaceId: number,
  request: CreateSessionRequest
): Promise<{ session: FlowSession; accessUrl: string }> {
  const response = await fetch(`/api/workspace/${workspaceId}/flow-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request)
  });

  const data = await response.json();

  if (!data.success) {
    switch (data.error.code) {
      case 'FLOW_NOT_FOUND':
        throw new Error('Flow nao encontrado');
      case 'FLOW_NOT_ACTIVE':
        throw new Error('Flow precisa estar ativo');
      case 'CLIENT_NOT_FOUND':
        throw new Error('Cliente nao encontrado');
      case 'CLIENT_NOT_IN_WORKSPACE':
        throw new Error('Cliente nao pertence a este workspace');
      default:
        throw new Error('Erro ao criar sessao');
    }
  }

  return data.data;
}

// Uso
const { session, accessUrl } = await createFlowSession(7, {
  flowId: 38,
  clientId: 1,
  expiresAt: '2026-02-18T00:00:00.000Z'
});

// Compartilhar accessUrl com o cliente
console.log('Link para o cliente:', accessUrl);
// https://app.testforge.com/flow-use/abc123xyz789def456
```

### Listar Sessoes do Workspace

```typescript
interface SessionListParams {
  status?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
  clientId?: number;
  flowId?: number;
}

async function listWorkspaceSessions(
  workspaceId: number,
  params?: SessionListParams
): Promise<FlowSession[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.clientId) queryParams.set('clientId', String(params.clientId));
  if (params?.flowId) queryParams.set('flowId', String(params.flowId));

  const url = `/api/workspace/${workspaceId}/flow-sessions?${queryParams}`;

  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json();

  return data.data.sessions;
}
```

### Revogar Sessao

```typescript
async function revokeSession(workspaceId: number, sessionId: number) {
  const response = await fetch(
    `/api/workspace/${workspaceId}/flow-sessions/${sessionId}`,
    {
      method: 'DELETE',
      credentials: 'include'
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error('Erro ao revogar sessao');
  }

  return data;
}
```

---

## Status de Sessao e Execucao

### Status de Sessao (FlowSession)

| Status | Descricao |
|--------|-----------|
| `ACTIVE` | Sessao ativa, cliente pode acessar |
| `COMPLETED` | Execucao finalizada com sucesso |
| `EXPIRED` | Sessao expirou (passou de expiresAt) |
| `REVOKED` | Sessao foi revogada por um admin |

### Status de Execucao

| Status | Descricao |
|--------|-----------|
| `IN_PROGRESS` | Execucao em andamento |
| `COMPLETED` | Execucao finalizada com sucesso |
| `FAILED` | Execucao finalizada com falha |

### Status de Card

| Status | Descricao |
|--------|-----------|
| `PENDING` | Card ainda nao foi executado |
| `PASSED` | Card executado com sucesso |
| `FAILED` | Card falhou |
| `SKIPPED` | Card foi pulado |

---

## Tratamento de Erros

### Erros Comuns de Autenticacao

```typescript
const CLIENT_AUTH_ERRORS = {
  'WORKSPACE_NOT_FOUND': 'Empresa nao encontrada. Verifique o endereco.',
  'WORKSPACE_INACTIVE': 'Esta empresa esta inativa.',
  'INVALID_CREDENTIALS': 'Email ou senha incorretos.',
  'UNAUTHORIZED': 'Sessao expirada. Faca login novamente.',
  'SESSION_INVALID': 'Sessao invalida.',
  'INVALID_CURRENT_PASSWORD': 'Senha atual incorreta.'
};
```

### Erros de Acesso ao Flow

```typescript
const FLOW_ACCESS_ERRORS = {
  'SESSION_NOT_FOUND': 'Link invalido ou nao encontrado.',
  'SESSION_EXPIRED': 'Este link expirou. Solicite um novo acesso.',
  'SESSION_REVOKED': 'O acesso foi revogado. Contate o administrador.',
  'FLOW_NOT_ACTIVE': 'Este flow nao esta disponivel no momento.'
};
```

---

## Fluxo Completo - Portal do Cliente

```
1. Cliente acessa /client/login
   |
2. Insere: slug do workspace + email + senha
   |
3. Sistema autentica e cria sessao (cookie)
   |
4. Cliente ve lista de flows disponiveis
   |
5. Cliente seleciona flow
   |
6. Sistema carrega flow via token da sessao
   |
7. Cliente inicia execucao
   |
8. Para cada card:
   |-- Cliente marca: PASSED / FAILED / SKIPPED
   |-- Sistema registra execucao do card
   |
9. Cliente finaliza execucao
   |
10. Sistema registra resultado final
   |
11. Cliente pode ver historico de execucoes
```

---

## Fluxo Completo - Acesso via Token

```
1. Admin cria sessao para cliente
   |-- POST /workspace/:id/flow-sessions
   |-- Recebe token e URL de acesso
   |
2. Admin compartilha URL com cliente
   |-- Ex: https://app.testforge.com/flow-use/abc123xyz
   |
3. Cliente acessa URL (sem login)
   |
4. Sistema valida token e carrega flow
   |
5. Cliente inicia e executa flow
   |
6. Sistema registra execucao
```

---

## Helpers Uteis

```typescript
// Verificar se sessao expirou
function isSessionExpired(session: { expiresAt: string }): boolean {
  return new Date(session.expiresAt) < new Date();
}

// Verificar se sessao esta ativa
function isSessionActive(session: { status: string; expiresAt: string }): boolean {
  return session.status === 'ACTIVE' && !isSessionExpired(session);
}

// Construir URL de acesso
function buildAccessUrl(token: string): string {
  return `${window.location.origin}/flow-use/${token}`;
}

// Calcular progresso da execucao
function calculateProgress(cards: any[], cardStatuses: Record<number, string>): number {
  const total = cards.length;
  const completed = Object.keys(cardStatuses).length;
  return Math.round((completed / total) * 100);
}

// Formatar data para exibicao
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('pt-BR');
}
```

---

## Consideracoes de Seguranca

1. **Tokens de Sessao**: Sao unicos e aleatorios. Nao expoem IDs internos.

2. **Expiracao**: Sempre verificar `expiresAt` antes de permitir acesso.

3. **Revogacao**: Admins podem revogar acesso a qualquer momento.

4. **Cookies HttpOnly**: Sessoes de cliente usam cookies seguros.

5. **Isolamento**: Cliente so ve flows do seu workspace.

6. **Logs de Execucao**: Todas as acoes sao registradas (se feature habilitada no plano).
