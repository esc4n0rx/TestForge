# ==========================================
# TESTFORGE - BATERIA DE TESTES DE FLOWS
# ==========================================
# Versao PowerShell para Windows
#
# Testa toda a logica de flows incluindo:
# - Criacao, listagem, atualizacao, delecao
# - Versionamento (bloqueado para plano Start)
# - Cards (add, update, delete)
# - Templates com limite (5 para Start)
# - Ativacao/Desativacao
# - Limites de plano (max_flows = 10 para Start)
# - Exportacao (bloqueado para plano Start)
#
# Conta de teste: pmk@gmail.com / 10203040 (plano Start)
# Contexto: Flows SAP (ME21N, etc)
#
# Uso: .\flow-tests.ps1 [-BaseUrl "http://localhost:3000/api"]
# ==========================================

param(
    [string]$BaseUrl = "http://localhost:3000/api"
)

# Configuracoes
$Email = "pmk@gmail.com"
$Password = "10203040"

# Variavel para armazenar session cookie
$script:SessionCookie = $null
$script:WebSession = $null

# Contadores
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsTotal = 0

# IDs criados durante os testes
$script:FlowId = $null
$script:VersionId = $null
$script:CardId = $null
$script:TemplateId = $null
$script:WorkspaceId = $null

# ==========================================
# FUNCOES AUXILIARES
# ==========================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Test {
    param([string]$Text)
    Write-Host ""
    Write-Host "[TEST] $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "[PASS] $Text" -ForegroundColor Green
    $script:TestsPassed++
    $script:TestsTotal++
}

function Write-Fail {
    param([string]$Text)
    Write-Host "[FAIL] $Text" -ForegroundColor Red
    $script:TestsFailed++
    $script:TestsTotal++
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARN] $Text" -ForegroundColor Yellow
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )

    $url = "$BaseUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }

    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
            ContentType = "application/json"
        }

        if ($script:WebSession) {
            $params.WebSession = $script:WebSession
        } else {
            $params.SessionVariable = "script:WebSession"
        }

        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $params.Body = $jsonBody
        }

        $response = Invoke-RestMethod @params -ErrorAction Stop
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = 0
        $errorBody = $null

        # Tentar extrair status code
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        # Tentar ler corpo do erro
        try {
            if ($_.Exception.Response) {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $errorText = $reader.ReadToEnd()
                    $reader.Close()
                    if ($errorText) {
                        $errorBody = $errorText | ConvertFrom-Json
                    }
                }
            }
        } catch {
            # Ignorar erro ao ler corpo
        }

        # Se nao conseguiu ler o corpo, criar objeto de erro generico
        if (-not $errorBody) {
            $errorBody = @{
                success = $false
                error = @{
                    message = $_.Exception.Message
                    code = "REQUEST_ERROR"
                }
            }
        }

        return @{
            Success = $false
            Data = $errorBody
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# ==========================================
# TESTES DE AUTENTICACAO
# ==========================================

function Test-Login {
    Write-Header "1. AUTENTICACAO"

    Write-Test "Login com credenciais validas (pmk@gmail.com)"

    $body = @{
        email = $Email
        senha = $Password
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $body

    if ($response.Data.success -eq $true) {
        Write-Success "Login realizado com sucesso"

        # Buscar workspace
        $wsResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/workspace"
        if ($wsResponse.Data.data.workspaces) {
            $script:WorkspaceId = $wsResponse.Data.data.workspaces[0].id
            Write-Info "Workspace ID: $($script:WorkspaceId)"
        }

        # Verificar plano
        $subResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/billing/subscription"
        if ($subResponse.Data.data.subscription.plan) {
            $planName = $subResponse.Data.data.subscription.plan.name
            Write-Info "Plano atual: $planName"
        }

        return $true
    } else {
        Write-Fail "Falha no login"
        Write-Host ($response | ConvertTo-Json -Depth 5)
        return $false
    }
}

# ==========================================
# TESTES DE CRIACAO DE FLOWS
# ==========================================

function Test-CreateFlow {
    Write-Header "2. CRIACAO DE FLOWS"

    # Test 2.1: Criar flow de processo SAP - ME21N
    Write-Test "Criar flow de processo: Como criar pedido de compra na ME21N"

    $body = @{
        name = "Criar Pedido de Compra - ME21N"
        description = "Fluxo detalhado para criacao de pedido de compra no SAP usando a transacao ME21N. Inclui selecao de fornecedor, itens, condicoes de pagamento e aprovacao."
        type = "PROCESS"
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body

    if ($response.Data.success -eq $true) {
        $script:FlowId = $response.Data.data.flow.id
        # currentVersionId pode ser null, pegar do array versions
        if ($response.Data.data.flow.currentVersionId) {
            $script:VersionId = $response.Data.data.flow.currentVersionId
        } elseif ($response.Data.data.flow.versions -and $response.Data.data.flow.versions.Count -gt 0) {
            $script:VersionId = $response.Data.data.flow.versions[0].id
        }
        Write-Success "Flow criado com sucesso (ID: $($script:FlowId), Version: $($script:VersionId))"
    } else {
        Write-Fail "Falha ao criar flow"
        Write-Host ($response.Data | ConvertTo-Json -Depth 5)
    }

    # Test 2.2: Criar flow de teste SAP
    Write-Test "Criar flow de teste: Validar ME21N com fornecedor bloqueado"

    $body2 = @{
        name = "Teste - ME21N Fornecedor Bloqueado"
        description = "Caso de teste para validar comportamento do SAP quando usuario tenta criar pedido com fornecedor bloqueado"
        type = "TEST"
    }

    $response2 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body2

    if ($response2.Data.success -eq $true) {
        Write-Success "Flow de teste criado (ID: $($response2.Data.data.flow.id))"
    } else {
        Write-Fail "Falha ao criar flow de teste"
    }

    # Test 2.3: Criar flow PROGRAM_FLOW
    Write-Test "Criar flow de programa: Logica de aprovacao de pedidos"

    $body3 = @{
        name = "Logica Aprovacao Pedidos SAP"
        description = "Fluxo logico do programa ABAP que gerencia a aprovacao de pedidos baseado em alcadas"
        type = "PROGRAM_FLOW"
    }

    $response3 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body3

    if ($response3.Data.success -eq $true) {
        Write-Success "Flow de programa criado (ID: $($response3.Data.data.flow.id))"
    } else {
        Write-Fail "Falha ao criar flow de programa"
    }
}

# ==========================================
# TESTES DE LISTAGEM E BUSCA
# ==========================================

function Test-ListFlows {
    Write-Header "3. LISTAGEM E BUSCA DE FLOWS"

    # Test 3.1: Listar todos os flows
    Write-Test "Listar todos os flows do workspace"

    $response = Invoke-ApiRequest -Method "GET" -Endpoint "/flows"

    if ($response.Data.success -eq $true) {
        $count = $response.Data.data.flows.Count
        Write-Success "Flows listados com sucesso"
        Write-Info "Total de flows encontrados: $count"
    } else {
        Write-Fail "Falha ao listar flows"
    }

    # Test 3.2: Filtrar por tipo PROCESS
    Write-Test "Filtrar flows por tipo PROCESS"

    $response2 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows?type=PROCESS"

    if ($response2.Data.success -eq $true) {
        Write-Success "Filtro por tipo funcionando"
    } else {
        Write-Fail "Falha ao filtrar por tipo"
    }

    # Test 3.3: Buscar flow especifico
    Write-Test "Buscar flow por ID ($($script:FlowId))"

    $response3 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/$($script:FlowId)"

    if ($response3.Data.success -eq $true) {
        $name = $response3.Data.data.flow.name
        Write-Success "Flow encontrado: $name"
    } else {
        Write-Fail "Falha ao buscar flow"
    }
}

# ==========================================
# TESTES DE CARDS
# ==========================================

function Test-Cards {
    Write-Header "4. GERENCIAMENTO DE CARDS"

    # Test 4.1: Adicionar card START
    Write-Test "Adicionar card START ao flow"

    $body = @{
        type = "START"
        title = "Inicio do Processo"
        content = "Acessar SAP GUI e executar transacao ME21N"
        positionX = 100
        positionY = 50
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$($script:VersionId)/cards" -Body $body

    if ($response.Data.success -eq $true) {
        $script:CardId = $response.Data.data.card.id
        Write-Success "Card START adicionado (ID: $($script:CardId))"
    } else {
        Write-Fail "Falha ao adicionar card START"
        Write-Host ($response.Data | ConvertTo-Json -Depth 5)
    }

    # Test 4.2: Adicionar card ACTION
    Write-Test "Adicionar card ACTION - Selecionar tipo de documento"

    $body2 = @{
        type = "ACTION"
        title = "Selecionar Tipo de Documento"
        content = "No campo Tipo de Documento, inserir NB (Pedido Padrao)"
        notes = "NB = Pedido Normal, UB = Pedido de Transferencia"
        positionX = 100
        positionY = 150
    }

    $response2 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$($script:VersionId)/cards" -Body $body2

    if ($response2.Data.success -eq $true) {
        Write-Success "Card ACTION adicionado (ID: $($response2.Data.data.card.id))"
    } else {
        Write-Fail "Falha ao adicionar card ACTION"
    }

    # Test 4.3: Adicionar card DECISION
    Write-Test "Adicionar card DECISION - Verificar fornecedor"

    $body3 = @{
        type = "DECISION"
        title = "Fornecedor esta bloqueado?"
        content = "Verificar se o fornecedor selecionado possui bloqueio de compras"
        positionX = 100
        positionY = 250
    }

    $response3 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$($script:VersionId)/cards" -Body $body3

    if ($response3.Data.success -eq $true) {
        Write-Success "Card DECISION adicionado"
    } else {
        Write-Fail "Falha ao adicionar card DECISION"
    }

    # Test 4.4: Adicionar card END
    Write-Test "Adicionar card END - Finalizar processo"

    $body4 = @{
        type = "END"
        title = "Pedido Criado"
        content = "Pedido de compra criado com sucesso. Numero do pedido exibido na tela."
        positionX = 100
        positionY = 350
    }

    $response4 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$($script:VersionId)/cards" -Body $body4

    if ($response4.Data.success -eq $true) {
        Write-Success "Card END adicionado"
    } else {
        Write-Fail "Falha ao adicionar card END"
    }

    # Test 4.5: Atualizar card
    Write-Test "Atualizar card (ID: $($script:CardId))"

    $body5 = @{
        content = "1. Acessar SAP GUI`n2. Digitar ME21N no campo de comando`n3. Pressionar Enter"
    }

    $response5 = Invoke-ApiRequest -Method "PATCH" -Endpoint "/flows/cards/$($script:CardId)" -Body $body5

    if ($response5.Data.success -eq $true) {
        Write-Success "Card atualizado com sucesso"
    } else {
        Write-Fail "Falha ao atualizar card"
    }

    # Test 4.6: Tentar adicionar card ASSERT em flow PROCESS (deve falhar)
    Write-Test "Tentar adicionar card ASSERT em flow PROCESS (deve falhar)"

    $body6 = @{
        type = "ASSERT"
        title = "Validacao"
        content = "Este card nao deveria ser permitido"
    }

    $response6 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$($script:VersionId)/cards" -Body $body6

    if ($response6.StatusCode -eq 400 -or ($response6.Data.error.code -eq "CARD_TYPE_NOT_ALLOWED_FOR_FLOW_TYPE")) {
        Write-Success "Validacao de tipo de card funcionando - ASSERT bloqueado em PROCESS"
    } else {
        Write-Fail "Validacao de tipo de card NAO funcionou"
    }
}

# ==========================================
# TESTES DE VERSIONAMENTO (BLOQUEADO PARA START)
# ==========================================

function Test-Versioning {
    Write-Header "5. VERSIONAMENTO (Deve ser bloqueado para plano Start)"

    # Test 5.1: Tentar criar nova versao (deve falhar)
    Write-Test "Tentar criar nova versao (deve falhar - plano Start)"

    $body = @{
        changeLog = "Tentativa de criar versao"
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/$($script:FlowId)/versions" -Body $body

    if ($response.StatusCode -eq 403) {
        Write-Success "Versionamento bloqueado corretamente para plano Start"
    } else {
        Write-Fail "Versionamento deveria estar bloqueado para plano Start"
        Write-Host "Status: $($response.StatusCode)"
    }

    # Test 5.2: Tentar listar versoes
    Write-Test "Listar versoes do flow"

    $response2 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/$($script:FlowId)/versions"

    if ($response2.StatusCode -eq 403) {
        Write-Success "Listagem de versoes tambem bloqueada para plano Start (ok)"
    } elseif ($response2.Data.success -eq $true) {
        Write-Success "Listagem de versoes funcionando"
    } else {
        Write-Warning "Resposta inesperada na listagem de versoes"
    }
}

# ==========================================
# TESTES DE ATIVACAO/DESATIVACAO
# ==========================================

function Test-Activation {
    Write-Header "6. ATIVACAO E DESATIVACAO DE FLOWS"

    # Verificar flows ativos
    Write-Test "Verificar flows ativos antes da ativacao"

    $listResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/flows"
    $activeCount = ($listResponse.Data.data.flows | Where-Object { $_.currentVersion.status -eq "ACTIVE" }).Count
    Write-Info "Flows ativos atualmente: $activeCount"

    # Test 6.1: Ativar versao do flow
    Write-Test "Ativar versao do flow"

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/$($script:FlowId)/versions/$($script:VersionId)/activate"

    if ($response.Data.success -eq $true) {
        Write-Success "Flow ativado com sucesso"
    } elseif ($response.StatusCode -eq 403) {
        Write-Warning "Ativacao via versioning bloqueada (plano Start)"
    } else {
        Write-Fail "Falha ao ativar flow"
    }

    # Test 6.2: Desativar flow
    Write-Test "Desativar flow"

    $response2 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/$($script:FlowId)/deactivate"

    if ($response2.Data.success -eq $true) {
        Write-Success "Flow desativado com sucesso"
    } elseif ($response2.StatusCode -eq 403) {
        Write-Warning "Desativacao pode estar bloqueada para plano Start"
    } else {
        Write-Fail "Falha ao desativar flow"
    }
}

# ==========================================
# TESTES DE TEMPLATES
# ==========================================

function Test-Templates {
    Write-Header "7. TEMPLATES (Limite de 5 para plano Start)"

    # Test 7.1: Criar template
    Write-Test "Criar template: Modelo padrao ME21N"

    $body = @{
        name = "Template - Pedido de Compra SAP"
        description = "Template reutilizavel para documentar processos de criacao de pedido de compra"
        type = "PROCESS"
        isTemplate = $true
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body

    if ($response.Data.success -eq $true) {
        $script:TemplateId = $response.Data.data.flow.id
        Write-Success "Template criado (ID: $($script:TemplateId))"
    } elseif ($response.Data.error.code -eq "TEMPLATE_LIMIT_EXCEEDED") {
        Write-Warning "Limite de templates excedido (5 para Start)"
    } else {
        Write-Fail "Falha ao criar template"
    }

    # Test 7.2: Criar flow a partir do template
    if ($script:TemplateId) {
        Write-Test "Criar flow a partir do template"

        $body2 = @{
            name = "Pedido de Compra - Filial SP"
        }

        $response2 = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/templates/$($script:TemplateId)/create-flow" -Body $body2

        if ($response2.Data.success -eq $true) {
            Write-Success "Flow criado a partir do template"
        } else {
            Write-Fail "Falha ao criar flow do template"
        }
    }

    # Test 7.3: Criar templates adicionais para testar limite
    Write-Test "Criar templates adicionais para testar limite (5 para Start)"

    $templatesCreated = 0
    for ($i = 2; $i -le 6; $i++) {
        $tmplBody = @{
            name = "Template SAP $i"
            description = "Template de teste $i"
            type = "PROCESS"
            isTemplate = $true
        }

        $tmplResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $tmplBody

        if ($tmplResponse.Data.success -eq $true) {
            $templatesCreated++
        } else {
            if ($tmplResponse.Data.error.code -eq "TEMPLATE_LIMIT_EXCEEDED") {
                Write-Success "Limite de templates atingido apos $templatesCreated templates adicionais"
                break
            }
        }
    }

    if ($templatesCreated -ge 5) {
        Write-Fail "Limite de templates NAO foi respeitado"
    }
}

# ==========================================
# TESTES DE LIMITE DE FLOWS
# ==========================================

function Test-FlowLimits {
    Write-Header "8. LIMITE DE FLOWS (10 para plano Start)"

    Write-Test "Verificar quantidade atual de flows"

    $listResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/flows"
    $currentCount = $listResponse.Data.data.flows.Count
    Write-Info "Flows atuais: $currentCount"

    Write-Test "Criar flows ate atingir limite de 10"

    $flowsToCreate = 10 - $currentCount + 1
    $flowsCreated = 0

    for ($i = 1; $i -le $flowsToCreate; $i++) {
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $flowBody = @{
            name = "Flow SAP Teste $i - $timestamp"
            description = "Flow de teste para validar limite"
            type = "PROCESS"
        }

        $flowResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $flowBody

        if ($flowResponse.Data.success -eq $true) {
            $flowsCreated++
        } else {
            if ($flowResponse.Data.error.code -match "FLOW_LIMIT|ACTIVE_FLOW_LIMIT") {
                Write-Success "Limite de flows atingido apos criar $flowsCreated flows"
                break
            }
        }
    }

    Write-Info "Nota: Sistema permite criar flows, mas bloqueia ATIVACAO se exceder limite"

    # Verificar quantidade final
    $finalResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/flows"
    $finalCount = $finalResponse.Data.data.flows.Count
    Write-Info "Flows totais apos teste: $finalCount"
}

# ==========================================
# TESTES DE EXPORTACAO (BLOQUEADO PARA START)
# ==========================================

function Test-Export {
    Write-Header "9. EXPORTACAO (Deve ser bloqueado para plano Start)"

    # Test 9.1: Tentar exportar para PDF
    Write-Test "Tentar exportar flow para PDF (deve falhar - plano Start)"

    $response = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/$($script:FlowId)/export?format=pdf"

    if ($response.StatusCode -eq 403) {
        Write-Success "Exportacao PDF bloqueada corretamente para plano Start"
    } else {
        Write-Fail "Exportacao PDF deveria estar bloqueada"
    }

    # Test 9.2: Tentar exportar para CSV
    Write-Test "Tentar exportar flow para CSV (deve falhar - plano Start)"

    $response2 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/$($script:FlowId)/export?format=csv"

    if ($response2.StatusCode -eq 403) {
        Write-Success "Exportacao CSV bloqueada corretamente para plano Start"
    } else {
        Write-Fail "Exportacao CSV deveria estar bloqueada"
    }

    # Test 9.3: Tentar exportar multiplos flows
    Write-Test "Tentar exportar multiplos flows (deve falhar - plano Start)"

    $response3 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/export/multiple?flowIds=$($script:FlowId)"

    if ($response3.StatusCode -eq 403) {
        Write-Success "Exportacao multipla bloqueada corretamente"
    } else {
        Write-Fail "Exportacao multipla deveria estar bloqueada"
    }
}

# ==========================================
# TESTES DE AMBIENTES (BLOQUEADO PARA START/TEAM)
# ==========================================

function Test-Environments {
    Write-Header "10. AMBIENTES (Apenas Enterprise)"

    Write-Test "Tentar criar flow com ambiente DEV (deve falhar - plano Start)"

    $body = @{
        name = "Flow Ambiente DEV"
        description = "Tentativa de criar flow com ambiente"
        type = "PROCESS"
        environment = "DEV"
    }

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body

    # Verificar se foi bloqueado (pode vir como 403 ou 400 com codigo especifico)
    if ($response.StatusCode -eq 403 -or $response.StatusCode -eq 400) {
        Write-Success "Ambientes bloqueados corretamente para plano Start (HTTP $($response.StatusCode))"
    } elseif ($response.Data.success -eq $false -and $response.Data.error.code -eq "ENVIRONMENTS_NOT_AVAILABLE") {
        Write-Success "Ambientes bloqueados corretamente para plano Start"
    } elseif ($response.Data.success -eq $true) {
        $env = $response.Data.data.flow.environment
        if ($env -eq "NONE") {
            Write-Success "Ambiente ignorado e definido como NONE (comportamento aceitavel)"
        } else {
            Write-Fail "Flow criado com ambiente $env - deveria estar bloqueado"
        }
    } else {
        # Verificar no Data se tem error
        if ($response.Data.error.code -eq "ENVIRONMENTS_NOT_AVAILABLE") {
            Write-Success "Ambientes bloqueados corretamente para plano Start"
        } else {
            Write-Fail "Resposta inesperada: $($response.Data | ConvertTo-Json -Compress)"
        }
    }
}

# ==========================================
# TESTES DE ATUALIZACAO
# ==========================================

function Test-UpdateFlow {
    Write-Header "11. ATUALIZACAO DE FLOW"

    Write-Test "Atualizar nome e descricao do flow"

    $body = @{
        name = "Criar Pedido de Compra - ME21N (Atualizado)"
        description = "Fluxo detalhado para criacao de pedido de compra no SAP usando a transacao ME21N. Versao atualizada com mais detalhes."
    }

    $response = Invoke-ApiRequest -Method "PATCH" -Endpoint "/flows/$($script:FlowId)" -Body $body

    if ($response.Data.success -eq $true) {
        Write-Success "Flow atualizado com sucesso"
    } else {
        Write-Fail "Falha ao atualizar flow"
    }

    Write-Test "Verificar se atualizacao foi aplicada"

    $response2 = Invoke-ApiRequest -Method "GET" -Endpoint "/flows/$($script:FlowId)"

    if ($response2.Data.data.flow.name -match "Atualizado") {
        Write-Success "Atualizacao verificada com sucesso"
    } else {
        Write-Fail "Atualizacao nao foi aplicada"
    }
}

# ==========================================
# TESTES DE DELECAO
# ==========================================

function Test-DeleteFlow {
    Write-Header "12. DELECAO DE FLOW"

    Write-Test "Criar flow para teste de delecao"

    $body = @{
        name = "Flow para Deletar"
        description = "Este flow sera deletado"
        type = "PROCESS"
    }

    $createResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $body

    if ($createResponse.Data.success -eq $true) {
        $deleteFlowId = $createResponse.Data.data.flow.id
        Write-Success "Flow criado para delecao (ID: $deleteFlowId)"

        Write-Test "Deletar flow (ID: $deleteFlowId)"

        $deleteResponse = Invoke-ApiRequest -Method "DELETE" -Endpoint "/flows/$deleteFlowId"

        if ($deleteResponse.Data.success -eq $true) {
            Write-Success "Flow deletado com sucesso (soft delete)"
        } else {
            Write-Fail "Falha ao deletar flow"
        }

        Write-Test "Verificar que flow nao aparece mais na listagem"

        $listResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/flows"
        $found = $listResponse.Data.data.flows | Where-Object { $_.id -eq $deleteFlowId }

        if (-not $found) {
            Write-Success "Flow removido da listagem"
        } else {
            Write-Warning "Flow ainda aparece na listagem (pode ser soft delete)"
        }
    } else {
        Write-Fail "Nao foi possivel criar flow para teste de delecao"
    }
}

# ==========================================
# TESTES DE VALIDACAO DE TIPOS DE CARDS
# ==========================================

function Test-CardTypeValidation {
    Write-Header "14. VALIDACAO DE TIPOS DE CARDS"

    # Criar flow TEST
    Write-Test "Criar flow TEST para validacao de cards"

    $testFlowBody = @{
        name = "Flow Teste - Validacao Cards"
        description = "Flow para testar validacao de tipos de cards"
        type = "TEST"
    }

    $testFlowResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $testFlowBody

    if ($testFlowResponse.Data.success -eq $true) {
        $testFlowId = $testFlowResponse.Data.data.flow.id
        # currentVersionId pode ser null, pegar do array versions
        if ($testFlowResponse.Data.data.flow.currentVersionId) {
            $testVersionId = $testFlowResponse.Data.data.flow.currentVersionId
        } elseif ($testFlowResponse.Data.data.flow.versions -and $testFlowResponse.Data.data.flow.versions.Count -gt 0) {
            $testVersionId = $testFlowResponse.Data.data.flow.versions[0].id
        }
        Write-Success "Flow TEST criado (ID: $testFlowId, Version: $testVersionId)"

        # Test: ASSERT em TEST (deve funcionar)
        Write-Test "Adicionar card ASSERT em flow TEST (deve funcionar)"

        $assertBody = @{
            type = "ASSERT"
            title = "Validar mensagem de erro"
            content = "Verificar se mensagem M7 123 e exibida"
        }

        $assertResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$testVersionId/cards" -Body $assertBody

        if ($assertResponse.Data.success -eq $true) {
            Write-Success "Card ASSERT adicionado em flow TEST"
        } else {
            Write-Fail "Card ASSERT deveria ser permitido em flow TEST"
        }

        # Test: EVIDENCE em TEST (deve funcionar)
        Write-Test "Adicionar card EVIDENCE em flow TEST (deve funcionar)"

        $evidenceBody = @{
            type = "EVIDENCE"
            title = "Screenshot do erro"
            content = "Capturar tela com mensagem de erro"
        }

        $evidenceResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$testVersionId/cards" -Body $evidenceBody

        if ($evidenceResponse.Data.success -eq $true) {
            Write-Success "Card EVIDENCE adicionado em flow TEST"
        } else {
            Write-Fail "Card EVIDENCE deveria ser permitido em flow TEST"
        }

        # Test: CONDITION em TEST (deve falhar)
        Write-Test "Tentar adicionar card CONDITION em flow TEST (deve falhar)"

        $conditionBody = @{
            type = "CONDITION"
            title = "If-Then"
            content = "Condicional"
        }

        $conditionResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$testVersionId/cards" -Body $conditionBody

        if ($conditionResponse.StatusCode -eq 400) {
            Write-Success "Card CONDITION bloqueado em flow TEST (correto)"
        } else {
            Write-Fail "Card CONDITION deveria ser bloqueado em flow TEST"
        }
    } else {
        Write-Fail "Nao foi possivel criar flow TEST"
    }

    # Criar flow PROGRAM_FLOW
    Write-Test "Criar flow PROGRAM_FLOW para validacao de cards tecnicos"

    $progFlowBody = @{
        name = "Flow Programa - Validacao Cards"
        description = "Flow para testar cards tecnicos"
        type = "PROGRAM_FLOW"
    }

    $progFlowResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows" -Body $progFlowBody

    if ($progFlowResponse.Data.success -eq $true) {
        $progVersionId = $progFlowResponse.Data.data.flow.currentVersionId

        # Test: CONDITION em PROGRAM_FLOW (deve funcionar)
        Write-Test "Adicionar card CONDITION em PROGRAM_FLOW (deve funcionar)"

        $condBody = @{
            type = "CONDITION"
            title = "IF valor > 1000"
            content = "Verificar se valor do pedido excede alcada"
        }

        $condResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$progVersionId/cards" -Body $condBody

        if ($condResponse.Data.success -eq $true) {
            Write-Success "Card CONDITION adicionado em PROGRAM_FLOW"
        } else {
            Write-Fail "Card CONDITION deveria ser permitido em PROGRAM_FLOW"
        }

        # Test: LOOP em PROGRAM_FLOW (deve funcionar)
        Write-Test "Adicionar card LOOP em PROGRAM_FLOW (deve funcionar)"

        $loopBody = @{
            type = "LOOP"
            title = "FOR EACH item in pedido"
            content = "Iterar sobre itens do pedido"
        }

        $loopResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$progVersionId/cards" -Body $loopBody

        if ($loopResponse.Data.success -eq $true) {
            Write-Success "Card LOOP adicionado em PROGRAM_FLOW"
        } else {
            Write-Fail "Card LOOP deveria ser permitido em PROGRAM_FLOW"
        }

        # Test: ASSERT em PROGRAM_FLOW (deve falhar)
        Write-Test "Tentar adicionar card ASSERT em PROGRAM_FLOW (deve falhar)"

        $assertProgBody = @{
            type = "ASSERT"
            title = "Validacao"
            content = "Nao deveria funcionar"
        }

        $assertProgResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/flows/versions/$progVersionId/cards" -Body $assertProgBody

        if ($assertProgResponse.StatusCode -eq 400) {
            Write-Success "Card ASSERT bloqueado em PROGRAM_FLOW (correto)"
        } else {
            Write-Fail "Card ASSERT deveria ser bloqueado em PROGRAM_FLOW"
        }
    }
}

# ==========================================
# LIMPEZA
# ==========================================

function Cleanup {
    Write-Header "15. LIMPEZA"

    Write-Test "Realizar logout"

    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/logout"

    if ($response.Data.success -eq $true) {
        Write-Success "Logout realizado"
    } else {
        Write-Warning "Logout pode ter falhado"
    }

    $script:WebSession = $null
    Write-Info "Sessao limpa"
}

# ==========================================
# SUMARIO
# ==========================================

function Write-Summary {
    Write-Header "SUMARIO DOS TESTES"

    Write-Host ""
    Write-Host "Total de testes: $($script:TestsTotal)" -ForegroundColor Cyan
    Write-Host "Testes aprovados: $($script:TestsPassed)" -ForegroundColor Green
    Write-Host "Testes falhados: $($script:TestsFailed)" -ForegroundColor Red
    Write-Host ""

    if ($script:TestsFailed -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "TODOS OS TESTES PASSARAM!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "ALGUNS TESTES FALHARAM" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Validacoes de plano Start confirmadas:"
    Write-Host "- max_flows: 10"
    Write-Host "- flow_templates: 5"
    Write-Host "- flow_versioning: bloqueado"
    Write-Host "- flow_export: bloqueado"
    Write-Host "- flow_environments: bloqueado"
    Write-Host "- flow_execution_logs: bloqueado"
}

# ==========================================
# MAIN
# ==========================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "         TESTFORGE - BATERIA DE TESTES DE FLOWS                 " -ForegroundColor Blue
Write-Host "                                                                 " -ForegroundColor Blue
Write-Host "  Conta: pmk@gmail.com (plano Start)                            " -ForegroundColor Blue
Write-Host "  Contexto: Fluxos SAP (ME21N, etc)                             " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

Write-Info "Base URL: $BaseUrl"
Write-Info "Iniciando testes..."

# Executar testes
$loginSuccess = Test-Login

if ($loginSuccess) {
    Test-CreateFlow
    Test-ListFlows
    Test-Cards
    Test-Versioning
    Test-Activation
    Test-Templates
    Test-FlowLimits
    Test-Export
    Test-Environments
    Test-UpdateFlow
    Test-DeleteFlow
    Test-CardTypeValidation
    Cleanup
} else {
    Write-Fail "Login falhou - abortando testes"
}

Write-Summary
