# Guia de Integração - Sistema de Billing (Frontend)

Este documento descreve o fluxo de integração do sistema de billing com Stripe Checkout para o frontend.

## Visão Geral do Fluxo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────>│   Backend   │────>│   Stripe    │────>│   Webhook   │
│  (React)    │     │   (API)     │     │  Checkout   │     │  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │ 1. POST /subscription                 │                   │
      │   {planId, billingCycle,              │                   │
      │    successUrl, cancelUrl}             │                   │
      │                   │                   │                   │
      │<──────────────────┤                   │                   │
      │ 2. {checkoutUrl}  │                   │                   │
      │                   │                   │                   │
      │ 3. window.location.href = checkoutUrl │                   │
      │──────────────────────────────────────>│                   │
      │                                       │                   │
      │        [Usuário paga no Stripe]       │                   │
      │                                       │                   │
      │<──────────────────────────────────────┤                   │
      │ 4. Redirect para successUrl           │                   │
      │                                       │                   │
      │                                       │ 5. webhook event  │
      │                                       │──────────────────>│
      │                                       │                   │
      │ 6. GET /subscription (verificar status)                   │
      │──────────────────>│                   │                   │
      │<──────────────────┤                   │                   │
      │ 7. {status: ACTIVE}                   │                   │
      │                   │                   │                   │
```

## Passo a Passo

### 1. Listar Planos Disponíveis

```typescript
// GET /api/billing/plans (não requer autenticação)
const response = await fetch('/api/billing/plans');
const { data } = await response.json();

// data.plans contém array de planos com preços e features
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "forge_start",
        "name": "Forge Start",
        "type": "START",
        "pricing": {
          "monthly": { "value": 7900, "formatted": "R$ 79.00" },
          "yearly": { "value": 79000, "formatted": "R$ 790.00", "monthlyEquivalent": "R$ 65.83" }
        },
        "features": [...]
      }
    ]
  }
}
```

### 2. Criar Sessão de Checkout

```typescript
// POST /api/billing/subscription (requer autenticação)
const response = await fetch('/api/billing/subscription', {
  method: 'POST',
  credentials: 'include', // importante para enviar cookie de sessão
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 1,
    billingCycle: 'monthly', // ou 'yearly'
    successUrl: `${window.location.origin}/billing/success`,
    cancelUrl: `${window.location.origin}/billing/plans`,
  }),
});

const { data, success, error } = await response.json();

if (success) {
  // Redirecionar para Stripe Checkout
  window.location.href = data.checkoutUrl;
} else {
  // Tratar erro
  console.error(error.message);
}
```

**Exemplo de resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "sessionId": "cs_test_...",
    "message": "Sessão de checkout criada. Redirecione o usuário para a URL."
  }
}
```

### 3. Página de Sucesso

Após o pagamento, o Stripe redireciona para a `successUrl` com o `session_id`:

```
https://app.testforge.com/billing/success?session_id=cs_test_xxx
```

**Componente de sucesso (React):**

```tsx
// /billing/success
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      // Aguardar um pouco para o webhook processar
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/billing/subscription', {
        credentials: 'include',
      });

      const { data, success } = await response.json();

      if (success && data.subscription?.status === 'ACTIVE') {
        setStatus('success');
      } else {
        // Webhook ainda não processou, tentar novamente
        setStatus('pending');
      }
    };

    checkSubscription();
  }, []);

  if (status === 'loading') {
    return <div>Processando seu pagamento...</div>;
  }

  if (status === 'pending') {
    return (
      <div>
        <p>Seu pagamento está sendo processado.</p>
        <p>Isso pode levar alguns segundos...</p>
        <button onClick={() => window.location.reload()}>
          Verificar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Pagamento confirmado!</h1>
      <p>Sua assinatura está ativa.</p>
      <button onClick={() => navigate('/dashboard')}>
        Ir para o Dashboard
      </button>
    </div>
  );
}
```

### 4. Página de Cancelamento

Se o usuário cancelar no Stripe, ele é redirecionado para `cancelUrl`:

```tsx
// /billing/plans (ou outra página)
export function BillingPlans() {
  const [searchParams] = useSearchParams();
  const wasCanceled = searchParams.get('canceled') === 'true';

  return (
    <div>
      {wasCanceled && (
        <div className="alert">
          Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}
      {/* Resto da página de planos */}
    </div>
  );
}
```

## Verificar Status da Assinatura

```typescript
// GET /api/billing/subscription
const response = await fetch('/api/billing/subscription', {
  credentials: 'include',
});

const { data, success } = await response.json();

if (success) {
  const { subscription } = data;

  // Verificar status
  switch (subscription.status) {
    case 'ACTIVE':
      // Acesso total
      break;
    case 'TRIALING':
      // Em trial
      break;
    case 'PAST_DUE':
      // Pagamento atrasado - modo read-only
      break;
    case 'INCOMPLETE':
      // Aguardando pagamento
      break;
    case 'CANCELED':
      // Assinatura cancelada
      break;
  }
}
```

## Tratamento de Erros

### Códigos de Erro Comuns

| Código | HTTP | Descrição | Ação Recomendada |
|--------|------|-----------|------------------|
| `UNAUTHORIZED` | 401 | Usuário não autenticado | Redirecionar para login |
| `NO_WORKSPACE` | 404 | Workspace não existe | Redirecionar para criar workspace |
| `SUBSCRIPTION_ALREADY_EXISTS` | 409 | Já possui assinatura ativa | Mostrar página de gerenciamento |
| `PLAN_NOT_FOUND` | 404 | Plano inválido | Recarregar lista de planos |
| `ENTERPRISE_PLAN_CONTACT_REQUIRED` | 400 | Plano Enterprise | Mostrar formulário de contato |
| `VALIDATION_ERROR` | 400 | Dados inválidos | Mostrar mensagem de erro |

### Exemplo de Tratamento

```typescript
async function createSubscription(planId: number, billingCycle: string) {
  try {
    const response = await fetch('/api/billing/subscription', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        billingCycle,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/plans?canceled=true`,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      switch (result.error.code) {
        case 'UNAUTHORIZED':
          window.location.href = '/login';
          return;
        case 'NO_WORKSPACE':
          window.location.href = '/workspace/create';
          return;
        case 'SUBSCRIPTION_ALREADY_EXISTS':
          window.location.href = '/billing/manage';
          return;
        case 'ENTERPRISE_PLAN_CONTACT_REQUIRED':
          showContactModal();
          return;
        default:
          showError(result.error.message);
          return;
      }
    }

    // Sucesso - redirecionar para Stripe
    window.location.href = result.data.checkoutUrl;

  } catch (error) {
    showError('Erro de conexão. Tente novamente.');
  }
}
```

## Atualizar Plano (Upgrade/Downgrade)

```typescript
// PUT /api/billing/subscription/plan
const response = await fetch('/api/billing/subscription/plan', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 2, // novo plano
    billingCycle: 'yearly',
  }),
});

const { success, data, error } = await response.json();

if (success) {
  // Plano atualizado com prorrateio
  showSuccess(data.message);
  // Atualizar UI
  refreshSubscription();
}
```

## Cancelar Assinatura

```typescript
// POST /api/billing/subscription/cancel
const response = await fetch('/api/billing/subscription/cancel', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    immediate: false, // cancela no fim do período
  }),
});

const { success, data } = await response.json();

if (success) {
  showSuccess(data.message);
  // "Assinatura será cancelada ao final do período atual."
}
```

## Reativar Assinatura

```typescript
// POST /api/billing/subscription/reactivate
const response = await fetch('/api/billing/subscription/reactivate', {
  method: 'POST',
  credentials: 'include',
});

const { success, data } = await response.json();

if (success) {
  showSuccess(data.message);
  // "Assinatura reativada com sucesso."
}
```

## Fluxo Completo - Exemplo React

```tsx
// hooks/useBilling.ts
import { useState, useCallback } from 'react';

interface Plan {
  id: number;
  code: string;
  name: string;
  pricing: {
    monthly: { value: number; formatted: string };
    yearly: { value: number; formatted: string; monthlyEquivalent: string };
  };
  features: Array<{ code: string; name: string; value: string }>;
}

interface Subscription {
  id: number;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'INCOMPLETE' | 'CANCELED' | 'UNPAID';
  plan: { id: number; name: string; code: string };
  billingCycle: 'MONTHLY' | 'YEARLY';
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export function useBilling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlans = useCallback(async (): Promise<Plan[]> => {
    const response = await fetch('/api/billing/plans');
    const { data } = await response.json();
    return data.plans;
  }, []);

  const getSubscription = useCallback(async (): Promise<Subscription | null> => {
    const response = await fetch('/api/billing/subscription', {
      credentials: 'include',
    });
    const { data, success } = await response.json();
    return success ? data.subscription : null;
  }, []);

  const subscribe = useCallback(async (planId: number, billingCycle: 'monthly' | 'yearly') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          successUrl: `${window.location.origin}/billing/success`,
          cancelUrl: `${window.location.origin}/billing/plans?canceled=true`,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error.message);
        return null;
      }

      // Redirecionar para Stripe Checkout
      window.location.href = result.data.checkoutUrl;
      return result.data;

    } catch (err) {
      setError('Erro de conexão');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (immediate: boolean = false) => {
    setLoading(true);

    const response = await fetch('/api/billing/subscription/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ immediate }),
    });

    const result = await response.json();
    setLoading(false);

    return result;
  }, []);

  return {
    loading,
    error,
    getPlans,
    getSubscription,
    subscribe,
    cancel,
  };
}
```

## Configuração do Stripe no Dashboard

Para que o fluxo funcione corretamente, configure no dashboard do Stripe:

### 1. Webhook Endpoint

- URL: `https://api.seudominio.com/api/webhook/stripe`
- Eventos necessários:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 2. Products e Prices

Crie os produtos com os Price IDs e atualize no banco de dados:
- `stripePriceMonthlyId` - Price ID para cobrança mensal
- `stripePriceYearlyId` - Price ID para cobrança anual

### 3. Customer Portal (Opcional)

Configure o Customer Portal do Stripe para permitir que usuários:
- Atualizem dados de pagamento
- Vejam histórico de faturas
- Cancelem assinatura pelo próprio Stripe

## Troubleshooting

### Assinatura não fica ACTIVE após pagamento

1. Verificar se webhook está configurado corretamente
2. Verificar logs do webhook no Stripe Dashboard
3. Verificar se `STRIPE_WEBHOOK_SECRET` está correto no `.env`

### Erro "NO_WORKSPACE"

O usuário precisa criar um workspace antes de assinar:
```typescript
// Fluxo recomendado:
1. Login/Registro
2. Criar Workspace (se não existir)
3. Assinar Plano
```

### Erro de CORS

Certifique-se de que as URLs de success/cancel usam o mesmo domínio do frontend.

---

**Última atualização:** 2026-01-14
**Versão da API:** 2.0.0
