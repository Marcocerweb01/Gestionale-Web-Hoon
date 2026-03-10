# ✅ CHECKLIST FINALE - Debug Webhook Instagram

## 🔍 Verifica Account Tester

Se l'app Meta è in **Development Mode**, i webhook funzionano SOLO se gli account sono **Tester**.

### Come verificare e aggiungere tester:

1. **Vai su Meta for Developers**
   - https://developers.facebook.com/apps/
   - Seleziona la tua app

2. **Vai su "Ruoli" (Roles)**
   - Sidebar sinistra → "Ruoli" o "App Roles"

3. **Vai su "Instagram Testers"**
   - Clicca su "Instagram Testers" o "Instagram Test Users"

4. **Verifica che questi account siano presenti:**
   - ✅ **marcocerasaa_** (l'account che COMMENTA)
   - ✅ **engyhub** (l'account che RICEVE i commenti)

5. **Se NON ci sono, aggiungi:**
   - Clicca "Add Instagram Testers"
   - Cerca l'username
   - Invia l'invito
   - L'utente deve ACCETTARE l'invito (vai su Instagram → Impostazioni → Account → App e siti web)

---

## 📝 Come accettare l'invito tester:

### Su Instagram App:

1. Apri **Instagram**
2. Vai su **Profilo** → **⚙️ Impostazioni**
3. **Account** → **App e siti web**
4. Dovresti vedere un invito in sospeso
5. **Accetta** l'invito

### Oppure via email:

- Controlla l'email associata all'account Instagram
- Cerca un'email da Meta/Facebook
- Clicca sul link di conferma

---

## 🧪 Dopo aver aggiunto i tester:

1. **Aspetta 2-3 minuti** (Meta ha bisogno di tempo per propagare le modifiche)

2. **Commenta di nuovo "info"** su un post di @engyhub

3. **Controlla i log di Railway**:
   - Se vedi `🔔 [WEBHOOK] Ricevuto evento COMPLETO` → Funziona! ✅
   - Se NON vedi nulla → C'è ancora un problema ❌

---

## 🔧 Se ancora non funziona:

### Opzione A: Passa l'app in Live Mode

Se non vuoi gestire i tester, puoi pubblicare l'app:

1. Completa l'**App Review** di Meta
2. Richiedi i permessi: `instagram_manage_comments`, `instagram_manage_messages`
3. Dopo l'approvazione, l'app funzionerà per TUTTI

### Opzione B: Usa un servizio di tunneling

Per testare in locale senza pubblicare:

1. Usa **ngrok** o **cloudflare tunnel**
2. Esponi il tuo server locale
3. Configura il webhook con l'URL pubblico

---

## 📊 Riepilogo stato attuale:

✅ Webhook endpoint configurato e verificato
✅ Account @engyhub sottoscritto ai webhook  
✅ Automazione "info" creata e attiva
✅ Token valido e permessi corretti
❓ Tester configurati? ← **VERIFICA QUESTO**

---

## 💡 Test alternativo:

Se vuoi testare che il webhook funzioni **senza dipendere da Instagram**:

Invia un webhook manualmente con questo comando PowerShell:

```powershell
$body = @{
    object = "instagram"
    entry = @(
        @{
            id = "26568886856060968"
            time = [int][double]::Parse((Get-Date -UFormat %s))
            changes = @(
                @{
                    field = "comments"
                    value = @{
                        from = @{
                            id = "test123"
                            username = "test_user"
                        }
                        media = @{
                            id = "test_media"
                            media_product_type = "FEED"
                        }
                        id = "test_comment_id"
                        text = "info"
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://gestionale-web-hoon-production.up.railway.app/api/webhook/social" -Method POST -Body $body -ContentType "application/json"
```

Se questo funziona e vedi nei log `✅ Match!`, allora il problema è 100% nei tester di Meta.

---

**Hai verificato i tester?** Dimmi cosa trovi! 🚀
