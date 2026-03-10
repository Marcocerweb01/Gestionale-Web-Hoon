# 🔍 Test Webhook Automazioni
# 
# Questo script invia un webhook di test al server per verificare
# che le automazioni funzionino correttamente.
#
# Uso:
# .\scripts\test-webhook.ps1 [URL_WEBHOOK] [ACCOUNT_ID]
#
# Esempio:
# .\scripts\test-webhook.ps1 http://localhost:3000 123456789012345
# .\scripts\test-webhook.ps1 https://gestionale.railway.app 123456789012345

param(
    [string]$WebhookUrl = "http://localhost:3000",
    [string]$AccountId = ""
)

# Colori per output
function Write-Success { param([string]$msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error-Custom { param([string]$msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning-Custom { param([string]$msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param([string]$msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Section { param([string]$msg) Write-Host "`n━━━ $msg ━━━`n" -ForegroundColor Blue }

Write-Host "`n🔍 Test Webhook Automazioni`n" -ForegroundColor Cyan

# Verifica parametri
if ($AccountId -eq "") {
    Write-Error-Custom "Account ID mancante!"
    Write-Info "Uso: .\scripts\test-webhook.ps1 [URL] [ACCOUNT_ID]"
    Write-Info "`nPer trovare l'Account ID:"
    Write-Info "1. Vai su /Operations/SocialAutomation"
    Write-Info "2. L'ID dell'account è nell'URL quando clicchi su 'Gestisci Automazioni'"
    Write-Info "   Oppure guarda nel database: db.socialaccounts.find()"
    exit 1
}

$WebhookEndpoint = "$WebhookUrl/api/webhook/social"

Write-Section "1. Configurazione"
Write-Info "Webhook URL: $WebhookEndpoint"
Write-Info "Account ID: $AccountId"

# ━━━ TEST 1: Verifica Connettività ━━━━━━━━━━━━━━━━━━━━━
Write-Section "2. Test Connettività"

try {
    $testUrl = "$WebhookEndpoint`?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123"
    Write-Info "Testing: $testUrl"
    
    $response = Invoke-WebRequest -Uri $testUrl -Method Get -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Webhook raggiungibile!"
        Write-Info "Risposta: $($response.Content)"
    }
} catch {
    Write-Error-Custom "Impossibile raggiungere il webhook!"
    Write-Warning-Custom "Errore: $($_.Exception.Message)"
    
    if ($WebhookUrl -like "*localhost*") {
        Write-Warning-Custom "Stai usando localhost. Assicurati che il server sia avviato:"
        Write-Info "npm run dev"
    }
    exit 1
}

# ━━━ TEST 2: Payload Instagram Comment ━━━━━━━━━━━━━━━━
Write-Section "3. Test Webhook POST (Instagram Comment)"

# Crea payload
$payload = @{
    object = "instagram"
    entry = @(
        @{
            id = $AccountId
            time = [int][double]::Parse((Get-Date -UFormat %s))
            changes = @(
                @{
                    field = "comments"
                    value = @{
                        id = "comment_test_$(Get-Random)"
                        text = "Ciao! Qual è il prezzo?"
                        from = @{
                            id = "user_test_$(Get-Random)"
                            username = "test_user"
                        }
                        media = @{
                            id = "media_$(Get-Random)"
                            media_product_type = "FEED"
                        }
                    }
                }
            )
        }
    )
}

$payloadJson = $payload | ConvertTo-Json -Depth 10
Write-Info "Payload:"
Write-Host $payloadJson -ForegroundColor Gray

Write-Info "`nInvio richiesta POST..."

try {
    $response = Invoke-WebRequest `
        -Uri $WebhookEndpoint `
        -Method Post `
        -Body $payloadJson `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Success "Webhook ricevuto! Status: $($response.StatusCode)"
    Write-Info "Risposta:"
    Write-Host $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
} catch {
    Write-Error-Custom "Errore nell'invio del webhook!"
    Write-Warning-Custom "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Warning-Custom "Messaggio: $($_.Exception.Message)"
    
    # Leggi body della risposta se disponibile
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Info "Dettagli errore:"
        Write-Host $responseBody -ForegroundColor Gray
    }
    
    exit 1
}

# ━━━ RIEPILOGO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write-Section "📊 Riepilogo"

Write-Success "✨ Test completato con successo!"

Write-Host "`nCosa controllare ora:"
Write-Host "1. Controlla i log del server per vedere se l'automazione è stata eseguita"
Write-Host "2. Se vedi 'Account non trovato', l'accountId non corrisponde"
Write-Host "3. Se vedi 'Skip: keyword non trovata', aggiungi 'prezzo' alle keyword"
Write-Host "4. Se vedi 'Automazione eseguita', controlla le stats nel DB"
Write-Host ""
Write-Host "Per test con commento reale:"
Write-Host "1. Vai su Instagram"
Write-Host "2. Commenta su un post dell'account connesso"
Write-Host "3. Attendi ~5 secondi per vedere il DM"
Write-Host ""
Write-Host "📖 Vedi TROUBLESHOOTING_AUTOMAZIONI.md per ulteriori dettagli"
Write-Host ""
