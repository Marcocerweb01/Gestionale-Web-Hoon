# Nuovo Sistema Pagamenti - Documentazione

## 📋 Panoramica

Il nuovo sistema di pagamenti è stato progettato per gestire entrate e uscite aziendali con tracciamento completo dei collaboratori e delle loro percentuali.

## 🚀 SETUP INIZIALE - IMPORTANTE!

### Prima di utilizzare il sistema, eseguire la migration dei collaboratori:

**Metodo 1 - Dalla Dashboard (CONSIGLIATO):**
1. Vai nella Dashboard
2. Clicca su "Mostra Opzioni Avanzate"
3. Clicca sul bottone **"🔧 Setup Nuovo Sistema"** (viola)
4. Conferma l'operazione

**Metodo 2 - Via API:**
```bash
# Verifica stato attuale
GET /api/collaboratori/migrate-fields

# Esegui migration
POST /api/collaboratori/migrate-fields
```

Questo aggiungerà automaticamente a tutti i collaboratori:
- `percentuale_hoon` con i valori corretti (50/55/60/70%)
- `tot_fatturato` inizializzato a 0
- `guadagno_da_hoon` inizializzato a 0
- `totale_fatture_terzi` inizializzato a 0

## 🎯 Caratteristiche Principali

### Schema Collaboratore Aggiornato
Ogni collaboratore ora ha:
- **percentuale_hoon**: Percentuale che il collaboratore guadagna (50/55/60/70%)
- **tot_fatturato**: Totale fatturato del collaboratore
- **guadagno_da_hoon**: Quanto guadagnato da clienti Hoon
- **totale_fatture_terzi**: Fatture verso terzi

### Percentuali Predefinite
- **50%**: Tutti i collaboratori (default)
- **55%**: Agnese Furesi (SMM)
- **70%**: Marco Cerasa (Web Designer), Lorenzo Pietrini (SMM), Francesco Bizzarri (SMM)

## 🔧 Come Impostare le Percentuali

Per impostare le percentuali iniziali, eseguire la chiamata POST a:

```
POST /api/collaboratori/imposta-percentuali
```

Questo imposterà automaticamente tutte le percentuali secondo le specifiche.

## 💰 Gestione Entrate

### Creazione Entrata
Un'entrata richiede:
1. **Chi paga**: Selezione del cliente
2. **Importo totale**: L'importo dell'entrata
3. **Servizio**: Tipo di servizio (Sito Web, Social Media, ecc.)
4. **Collaboratori**: Uno o più collaboratori con:
   - Uso percentuale predefinita O cifra fissa
   - Calcolo automatico dell'importo

### ⚠️ Generazione Automatica Uscite
**IMPORTANTE**: Quando crei un'entrata, il sistema genera automaticamente un'uscita per ogni collaboratore specificato!

- Importo uscita = (Importo entrata × Percentuale) / 100
- Stato predefinito uscita: "ragazzi"
- Le uscite sono collegate all'entrata

## 📤 Gestione Uscite

### Uscite Manuali
Puoi creare uscite manuali verso:
- **Collaboratore**: Pagamento a un collaboratore
- **Azienda Esterna**: Pagamento a fornitori
- **Servizio Esterno**: Google Ads, Facebook Ads, ecc.

### Uscite Auto-Generate
Le uscite generate automaticamente da entrate:
- Sono contrassegnate con `generata_da_entrata: true`
- Hanno riferimento all'entrata originale
- Se elimini l'entrata, vengono eliminate automaticamente

## 🔍 Filtri Disponibili

### Filtri Temporali
- **Mese**: Filtra per mese specifico (1-12)
- **Anno**: Filtra per anno

### Filtri per Tipo
- **Azienda/Cliente**: Cerca per nome, etichetta o ragione sociale
- **Servizio**: Filtra per tipo di servizio
- **Collaboratore**: Filtra per collaboratore specifico
- **Stato**: Pagato / Non Pagato / Ragazzi

### Ordinamenti
- Data (più recente/più vecchio)
- Importo (maggiore/minore)
- Solo Entrate
- Solo Uscite

## 📊 Statistiche

La dashboard mostra:
- **Totale Entrate**: Somma di tutte le entrate con conteggio
- **Totale Uscite**: Somma di tutte le uscite con conteggio
- **Bilancio**: Differenza tra entrate e uscite
- Indicatore visivo attivo/passivo

## 🎨 Servizi Personalizzabili

### Servizi Predefiniti
- Sito Web
- Social Media
- Brand Identity
- Gestione Sito
- Dominio e Hosting
- Evento
- Gestionale
- Video Making
- Servizio Fotografico

### Aggiungere Servizi
Nel form di creazione entrata, clicca il pulsante "+" accanto alla selezione servizio per aggiungerne di nuovi.

## 🗑️ Eliminazione Pagamenti

### Eliminazione Entrata
Quando elimini un'entrata:
1. Vengono eliminate tutte le uscite auto-generate
2. I totali dei collaboratori vengono aggiornati (sottratti)

### Eliminazione Uscita
- Uscite manuali: Aggiorna i totali del collaboratore
- Uscite auto-generate: Non eliminare manualmente, elimina l'entrata!

## 🔄 Aggiornamento Stato

Gli stati disponibili sono:
- **non_pagato**: Pagamento in attesa
- **pagato**: Pagamento completato
- **ragazzi**: Stato speciale per uscite verso collaboratori

Puoi cambiare lo stato direttamente dalla tabella usando il dropdown.

## 📱 Interfaccia Mobile

L'interfaccia è completamente responsive:
- Desktop: Tabella completa
- Mobile: Card view ottimizzata

## 🚀 Accesso al Sistema

Il nuovo sistema è disponibile nella **Dashboard > Opzioni Avanzate > Nuovo Sistema Pagamenti**

Solo gli amministratori hanno accesso alla pagina.

## 📈 Tracciamento Collaboratori

Il sistema aggiorna automaticamente i campi del collaboratore:
- Quando crei un'entrata con collaboratori → incrementa `guadagno_da_hoon` e `tot_fatturato`
- Quando crei un'uscita manuale verso collaboratore → incrementa `totale_fatture_terzi` e `tot_fatturato`
- Le eliminazioni decrementano i valori corrispondenti

## ⚙️ API Endpoints

### Pagamenti
- `GET /api/pagamenti-nuovi` - Lista pagamenti con filtri
- `POST /api/pagamenti-nuovi` - Crea entrata o uscita
- `GET /api/pagamenti-nuovi/[id]` - Dettaglio singolo pagamento
- `PATCH /api/pagamenti-nuovi/[id]` - Aggiorna pagamento
- `DELETE /api/pagamenti-nuovi/[id]` - Elimina pagamento

### Servizi
- `GET /api/servizi` - Lista servizi disponibili
- `POST /api/servizi` - Aggiungi nuovo servizio

### Collaboratori
- `POST /api/collaboratori/imposta-percentuali` - Imposta percentuali iniziali

## 🔐 Note Importanti

1. **Backup**: Consigliato fare backup prima di operazioni massive
2. **Percentuali**: Modificare percentuali non ricalcola pagamenti passati
3. **Entrate**: Sempre controllare collaboratori prima di salvare
4. **Uscite Auto**: Non modificare manualmente, gestirle tramite entrate
5. **Date**: Il sistema usa mese/anno per filtri rapidi

## 🆘 Risoluzione Problemi

### Problema: Uscita non generata
- Verifica che i collaboratori siano selezionati
- Controlla che l'importo sia valido
- Verifica lo stato del collaboratore (deve essere "attivo")

### Problema: Totali non aggiornati
- Il sistema aggiorna automaticamente, ricaricare la pagina
- Verificare che il collaboratore sia correttamente associato

### Problema: Percentuale non applicata
- Controllare campo `percentuale_hoon` del collaboratore
- Rieseguire impostazione percentuali se necessario
