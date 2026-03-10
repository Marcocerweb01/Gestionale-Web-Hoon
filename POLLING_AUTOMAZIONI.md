# 🔄 Sistema di Polling per Automazioni Instagram

## ⚡ SOLUZIONE RAPIDA SENZA WEBHOOK

Siccome i webhook di Meta in Development Mode sono inaffidabili, ho creato un sistema di **polling automatico**.

---

## 🎯 Come Funziona:

Invece di aspettare che Meta invii webhook:
- **Ogni minuto** il sistema controlla se ci sono nuovi commenti
- **Automaticamente** invia DM se trova keyword
- **Funziona SUBITO** senza aspettare Meta

---

## 🚀 Attivazione:

### Opzione A: Cron Job Railway (CONSIGLIATO)

1. Vai su **Railway Dashboard**
2. Seleziona il tuo progetto
3. **Settings** → **Cron Jobs**  
4. Aggiungi:
   ```
   Schedule: */1 * * * * (ogni minuto)
   Command: curl https://gestionale-web-hoon-production.up.railway.app/api/automations/poll
   ```

### Opzione B: Test Manuale

Per testare subito senza cron:

```powershell
# Esegui questo ogni volta che vuoi controllare i commenti
Invoke-WebRequest "https://gestionale-web-hoon-production.up.railway.app/api/automations/poll"
```

---

## 🧪 TEST:

1. **Commenta "info"** su un post di @engyhub
2. **Aspetta 30 secondi**
3. **Esegui** il comando sopra (o aspetta che il cron si attivi)
4. **Controlla i log Railway**:
   ```
   🔄 [POLLING] Controllo nuovi commenti...
   💬 [POLLING] Nuovo commento da @marcocerasaa_: "info"
   ✅ [POLLING] Match automazione: info
   📤 [POLLING] DM inviato
   ```
5. **Controlla i DM** - dovresti riceverlo!

---

## ✅ VANTAGGI:

- ✅ **Funziona SUBITO** (non aspetta Meta)
- ✅ **Affidabile** (non dipende dai webhook)
- ✅ **Semplice** da debuggare
- ✅ **Nessun costo** extra

## ⚠️ LIMITI:

-Ritardo di max 1 minuto (vs webhook istantanei)
- Consuma più API calls di Meta (ma comunque poche)

---

## 🔧 Per Production:

Quando pubblichi l'app e i webhook funzionano:
1. Disattiva il cron job
2. I webhook saranno istantanei
3. Il polling serve solo per dev mode

---

**Testa ora con il comando manuale sopra!** 🚀
