# 🎯 Setup n8n per Instagram Auto-Reply

## 📋 ISTRUZIONI COMPLETE

### 1️⃣ Importa il Workflow

1. Apri **n8n** (locale o cloud)
2. Click **+** → **Import from File**
3. Seleziona `n8n-instagram-auto-reply.json`
4. Click **Import**

---

### 2️⃣ Configura le Credenziali

#### A. Instagram Bearer Token

1. Nel workflow, vai sul nodo **"Send DM"**
2. Click su **"Credentials"**
3. **Create New** → **Bearer Token Auth**
4. **Nome**: `Instagram Bearer Token`
5. **Token**: Copia il token di @engyhub dal database
   
   Per ottenere il token, esegui:
   ```bash
   node scripts/list-all-accounts.js
   ```
   
   Copia il valore del campo `accessToken` di engyhub

6. **Save**

---

### 3️⃣ Modifica il Workflow (Opzionale)

#### Cambia la Keyword

Nel nodo **"Check Keyword 'info'"**:
- Cambia `"info"` con la tua keyword
- Puoi aggiungere più condizioni (OR/AND)

#### Cambia il Messaggio

Nel nodo **"Send DM"**:
- Modifica il campo `text` nel JSON:
  ```json
  "text": "Il tuo messaggio personalizzato qui"
  ```

#### Cambia Frequenza

Nel nodo **"Every 1 Minute"**:
- Cambia da 1 minuto a quello che preferisci
- Es: `5 minutes` per controllare ogni 5 minuti

---

### 4️⃣ Attiva il Workflow

1. Click su **"Active"** in alto a destra
2. Il workflow parte automaticamente ogni minuto
3. Guarda i log in basso mentre si esegue

---

## 🧪 TEST

### Test Manuale (Prima di Attivare)

1. Click destro su **"Every 1 Minute"** → **"Execute node"**
2. Segui l'esecuzione step by step
3. Controlla che ogni nodo funzioni

### Test Reale

1. **Commenta "info"** su un post di @engyhub
2. **Aspetta max 1 minuto** (il prossimo run del workflow)
3. **Controlla i DM** - dovresti ricevere il messaggio!

---

## 📊 Come Funziona

```
⏰ Ogni 1 minuto
    ↓
📱 Recupera account Instagram dal gestionale
    ↓
📸 Per ogni account, ottiene ultimi 5 post
    ↓
💬 Per ogni post, legge i commenti
    ↓
🔍 Filtra commenti con keyword "info"
    ↓
📤 Invia DM automatico 
    ↓
💾 Salva log nel database
```

---

## ✅ VANTAGGI vs Webhook

- ✅ **Funziona SUBITO** (non dipende da Meta)
- ✅ **Affidabile** (controllo attivo)
- ✅ **Visuale** (vedi ogni step in tempo reale)
- ✅ **Modificabile** (drag & drop)
- ✅ **Debuggabile** (vedi tutti i dati)

## ⚠️ Note

- **Max delay**: 1 minuto (se controlli ogni minuto)
- **API calls**: ~10-20 al minuto (molto basse)
- **Memoria**: n8n tiene traccia dei commenti processati

---

## 🔧 Troubleshooting

### "Error: Invalid access token"

→ Il token è scaduto. Riconnetti @engyhub nel gestionale e aggiorna il Bearer Token in n8n.

### "No comments found"

→ Normale se non ci sono nuovi commenti. Prova a commentare "info" e aspetta max 1 minuto.

### Workflow non si attiva

→ Verifica che sia **Active** (toggle verde in alto a destra).

---

## 🚀 Setup n8n Cloud (se non hai n8n)

1. Vai su **https://n8n.io/**
2. **Sign Up** gratuito
3. Crea un nuovo workflow
4. Importa il JSON
5. Configura e attiva

**Oppure usa n8n in Docker:**

```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

Poi vai su http://localhost:5678

---

**Importa il workflow e configura il token!** 🎉
