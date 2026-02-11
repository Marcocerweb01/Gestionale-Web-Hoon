# 🎯 Strategia Social Media Manager - Operations

## Architettura Proposta

### Dashboard Separata per SMM
```
app/SocialManager/
  ├── page.jsx (dashboard principale SMM)
  ├── Clienti/
  │   ├── page.jsx (lista clienti SMM)
  │   └── [clienteId]/
  │       ├── page.jsx (overview cliente)
  │       ├── Automations/page.jsx
  │       ├── Schedule/page.jsx
  │       └── Analytics/page.jsx
  ├── Inbox/
  │   └── page.jsx (messaggi unificati tutti clienti)
  └── Settings/
      └── page.jsx (collega account social)
```

## Flusso Operativo

### 1. Setup Iniziale (Admin)
- Admin crea cliente nel sistema esistente
- Admin assegna SMM al cliente
- SMM accede alla sua dashboard dedicata

### 2. Connessione Social (SMM)
- SMM collega account social del cliente:
  - Instagram Business
  - Facebook Page
  - LinkedIn Company Page
- OAuth flow con Meta/LinkedIn
- Token salvati criptati nel DB

### 3. Gestione Automazioni
**Per Commenti (Quick Win):**
```
Cliente: Agenzia Immobiliare "Casa Bella"
Post Instagram: Foto villa

Automazione:
- Keyword: "prezzo", "disponibile", "info"
- Azione DM: "Ciao! Ti invio subito tutte le info 🏠"
- Azione Commento: "Ti scrivo in DM! 📩"
```

**Per Programmazione Post:**
```
SMM crea post programmato:
- Upload media (foto/video)
- Testo caption
- Hashtag
- Platforms: IG + FB
- Data/Ora pubblicazione
- Auto-publish via API
```

### 4. Inbox Unificata
```
Dashboard SMM vede:
├── Cliente A (Agenzia Immobiliare)
│   ├── IG: 5 messaggi non letti
│   └── FB: 2 messaggi non letti
├── Cliente B (E-commerce Moda)
│   ├── IG: 12 messaggi non letti
│   └── LinkedIn: 1 messaggio
└── Filtri: Non letti, Oggi, Con keyword
```

## Permessi & Accessi

### Ruolo: "social-media-manager" (nuovo subrole)
**Può:**
- ✅ Vedere solo suoi clienti assegnati
- ✅ Creare/modificare automazioni
- ✅ Programmare post
- ✅ Rispondere a messaggi
- ✅ Vedere analytics clienti

**NON può:**
- ❌ Vedere altri collaboratori
- ❌ Accedere a pagamenti
- ❌ Modificare dati aziendali clienti
- ❌ Vedere Operations (QR/Image)

### Database Schema
```javascript
// models/ClienteSocial.js
{
  clienteId: ObjectId, // Riferimento cliente esistente
  smmAssegnato: ObjectId, // Riferimento user SMM
  socialAccounts: [{
    platform: 'instagram' | 'facebook' | 'linkedin',
    accountId: String,
    username: String,
    accessToken: String, // Criptato
    refreshToken: String,
    expiresAt: Date,
    connectedAt: Date
  }],
  automations: [ObjectId], // Riferimenti AutomationRule
  postsProgrammati: Number,
  messaggiGestiti: Number
}

// models/MessageHistory.js (già discusso)
// models/AutomationRule.js (già discusso)
```

## UI Componenti Chiave

### 1. Dashboard SMM Principale
```jsx
<DashboardSMM>
  <StatsCards>
    - Clienti attivi: 5
    - Messaggi oggi: 23
    - Automazioni attive: 12
    - Post programmati: 8
  </StatsCards>
  
  <ClientiGrid>
    {clienti.map(c => (
      <ClienteCard
        nome={c.nome}
        piattaforme={c.socialAccounts}
        messaggiNonLetti={c.unreadCount}
        automazioni={c.automations.length}
      />
    ))}
  </ClientiGrid>
</DashboardSMM>
```

### 2. Gestione Cliente Singolo
```jsx
<ClienteDetail clienteId={id}>
  <Tabs>
    <Tab label="Inbox">
      <InboxUnificata 
        instagram={messages.ig}
        facebook={messages.fb}
        onReply={handleReply}
      />
    </Tab>
    
    <Tab label="Automazioni">
      <AutomationsList 
        automations={automations}
        onCreate={openCreateModal}
      />
    </Tab>
    
    <Tab label="Calendario">
      <PostScheduler
        calendar={scheduledPosts}
        onSchedule={handleSchedulePost}
      />
    </Tab>
    
    <Tab label="Analytics">
      <AnalyticsCharts
        engagement={stats.engagement}
        growth={stats.growth}
        topPosts={stats.topPosts}
      />
    </Tab>
  </Tabs>
</ClienteDetail>
```

### 3. Modal Crea Automazione
```jsx
<CreateAutomationModal>
  <Select label="Piattaforma">
    <Option>Instagram</Option>
    <Option>Facebook</Option>
  </Select>
  
  <Input label="Nome Automazione" />
  
  <KeywordInput 
    label="Parole chiave"
    keywords={keywords}
    onAdd={addKeyword}
  />
  
  <Textarea 
    label="Messaggio DM automatico"
    placeholder="Ciao! Grazie per..."
  />
  
  <Checkbox label="Rispondi anche al commento" />
  
  <Button onClick={createAutomation}>
    Crea Automazione
  </Button>
</CreateAutomationModal>
```

## Integrazione con Sistema Esistente

### Modifica Dashboard Admin
```jsx
// In Components/Dashboard.jsx
{session?.user?.role === "amministratore" && (
  <Link href="/SocialManager">
    <button>
      <Share2 /> Gestione Social Manager
    </button>
  </Link>
)}

// Nuova pagina: /SocialManager/Assegnazioni
// Admin può:
// - Assegnare clienti a SMM
// - Vedere panoramica automazioni attive
// - Monitoring generale
```

### Nuovo Flusso Registrazione
```javascript
// app/Register/page.jsx
<Select name="subrole">
  <option>webdesigner</option>
  <option>commerciale</option>
  <option>social-media-manager</option> // NUOVO
</Select>
```

## Pricing & Monetizzazione

### Modello Suggerito
**Per Cliente Social:**
- Setup iniziale: €150 (one-time)
- Gestione mensile: €199/mese
  - Include:
    - Automazioni illimitate
    - Programmazione post
    - Inbox unificata
    - Analytics

**Per SMM:**
- Quota fissa: €500/mese per il servizio
- Oppure: 30% delle entrate dai suoi clienti

## Timeline Implementazione

### FASE 1: Base Infrastructure (1 settimana)
- [ ] Crea subrole "social-media-manager"
- [ ] Model ClienteSocial
- [ ] Dashboard SMM base
- [ ] Assegnazione clienti da admin

### FASE 2: Automazioni Commenti (2 settimane)
- [ ] OAuth Meta (FB/IG)
- [ ] Webhook commenti
- [ ] Sistema keyword matching
- [ ] UI creazione automazioni
- [ ] Testing

### FASE 3: Inbox & Programmazione (2 settimane)
- [ ] Inbox unificata
- [ ] Post scheduler
- [ ] Calendar view
- [ ] Auto-publish API

### FASE 4: Meta App Review (4-6 settimane)
- [ ] Documentazione
- [ ] Video demo
- [ ] Privacy policy
- [ ] Submit per review
- [ ] Attesa approvazione

### FASE 5: Analytics & Polish (1 settimana)
- [ ] Dashboard analytics
- [ ] Report automatici
- [ ] Export dati
- [ ] Documentazione uso

## Totale: 10-12 settimane (2.5-3 mesi)

## Next Steps

1. **Decidere priorità:**
   - Vuoi fare tutto in-house?
   - O integrare con strumento esistente (Zapier/ManyChat)?

2. **Iniziare MVP:**
   - Solo automazioni commenti IG
   - 1-2 clienti beta test
   - No post scheduler (solo DM auto)

3. **Validare mercato:**
   - Hai già SMM interessati?
   - Hai clienti che pagherebbero €199/mese?

Dimmi cosa vuoi fare! 🚀
