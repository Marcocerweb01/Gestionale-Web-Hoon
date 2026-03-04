# 🚀 Guida Completa: Trasformazione in SaaS Multi-Tenant

## 📋 Indice

1. [Panoramica Architetturale](#panoramica-architetturale)
2. [Database Design](#database-design)
3. [Fase 1: Multi-Tenancy Base](#fase-1-multi-tenancy-base)
4. [Fase 2: Sistema Servizi Dinamici](#fase-2-sistema-servizi-dinamici)
5. [Fase 3: UI Builder](#fase-3-ui-builder)
6. [Fase 4: Billing & Payments](#fase-4-billing--payments)
7. [Fase 5: Advanced Features](#fase-5-advanced-features)
8. [Sicurezza & Performance](#sicurezza--performance)
9. [Migration Path](#migration-path)
10. [Pricing Strategy](#pricing-strategy)

---

## 🎯 Panoramica Architetturale

### Obiettivo
Trasformare l'app da "single-tenant" (una sola azienda) a **SaaS Multi-Tenant** dove:
- Ogni azienda ha i suoi dati isolati
- Ogni azienda può creare servizi custom
- Sistema di fatturazione centralizzato
- Subdomain per ogni customer (es: `acme.tuodominio.com`)

### Stack Tecnologico
```
Frontend: Next.js 16 + React + TailwindCSS (già presente)
Backend: Next.js API Routes + MongoDB (già presente)
Auth: NextAuth.js → esteso per multi-org
Payments: Stripe (da aggiungere)
Email: Nodemailer (già presente)
File Storage: AWS S3 o Cloudinary (opzionale)
```

### Architettura a Layers

```
┌─────────────────────────────────────┐
│   Landing Page (www.tuodominio.com) │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│    Subdomain Router Middleware      │
│  (acme.app.com → orgId: 123)        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   Organization Context + Auth       │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Service Engine (Dynamic)       │
│  - Service Templates                │
│  - Service Instances                │
│  - Workflow Engine                  │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│    MongoDB (Multi-Tenant Data)      │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Design

### Nuovi Modelli Core

#### 1. Organization (Tenant)

```javascript
// models/Organization.js
import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  // Info Base
  nome: { 
    type: String, 
    required: true 
  },
  subdomain: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/ // solo lettere, numeri, trattini
  },
  
  // Branding
  logo: String,
  coloriPrimari: {
    primario: { type: String, default: '#3B82F6' },
    secondario: { type: String, default: '#10B981' }
  },
  
  // Piano e Limiti
  piano: { 
    type: String, 
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  limiti: {
    utenti: { type: Number, default: 3 },
    servizi: { type: Number, default: 2 },
    progetti: { type: Number, default: 50 },
    storage: { type: Number, default: 1024 } // MB
  },
  
  // Owner e Team
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  
  // Billing
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'canceled', 'past_due', 'trial'],
    default: 'trial'
  },
  trialEndsAt: Date,
  
  // Settings
  settings: {
    timezone: { type: String, default: 'Europe/Rome' },
    lingua: { type: String, default: 'it' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' }
  },
  
  // Status
  attiva: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
OrganizationSchema.index({ subdomain: 1 });
OrganizationSchema.index({ owner: 1 });

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
```

#### 2. ServiceTemplate (Servizio Configurabile)

```javascript
// models/ServiceTemplate.js
import mongoose from 'mongoose';

const CampoCustomSchema = new mongoose.Schema({
  nome: { type: String, required: true }, // nome tecnico: "budget_iniziale"
  etichetta: { type: String, required: true }, // label UI: "Budget Iniziale"
  descrizione: String,
  
  tipo: { 
    type: String, 
    required: true,
    enum: [
      'text',        // input testo
      'textarea',    // area testo lunga
      'number',      // numero
      'currency',    // valuta con simbolo
      'boolean',     // toggle/checkbox
      'date',        // datepicker
      'datetime',    // data + ora
      'select',      // dropdown
      'multiselect', // selezione multipla
      'file',        // upload file
      'email',       // email con validazione
      'phone',       // telefono
      'url',         // link
      'color',       // color picker
      'rating'       // stelle 1-5
    ]
  },
  
  // Configurazione per select
  opzioni: [{
    valore: String,
    etichetta: String
  }],
  
  // Validazione
  obbligatorio: { type: Boolean, default: false },
  validazione: {
    min: Number,
    max: Number,
    pattern: String, // regex
    messaggioErrore: String
  },
  
  // UI
  placeholder: String,
  helpText: String,
  ordine: { type: Number, default: 0 },
  larghezza: { 
    type: String, 
    enum: ['full', 'half', 'third'],
    default: 'full' 
  },
  
  // Visibilità condizionale
  visibilitaCondizionale: {
    campoDipendente: String,
    condizione: String, // 'equals', 'not_equals', 'contains'
    valore: mongoose.Schema.Types.Mixed
  }
});

const StatoWorkflowSchema = new mongoose.Schema({
  id: { type: String, required: true },
  etichetta: { type: String, required: true },
  colore: { 
    type: String, 
    default: '#6B7280' 
  },
  icona: String,
  ordine: { type: Number, default: 0 },
  
  // Stati successivi possibili
  transizioniPossibili: [String],
  
  // Azioni automatiche quando si entra in questo stato
  azioniAutomatiche: [{
    tipo: { type: String, enum: ['email', 'notifica', 'webhook', 'task'] },
    configurazione: mongoose.Schema.Types.Mixed
  }]
});

const ServiceTemplateSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true 
  },
  
  // Info Base
  nome: { type: String, required: true },
  descrizione: String,
  icona: { type: String, default: 'briefcase' }, // nome icona lucide-react
  colore: { type: String, default: '#3B82F6' },
  
  // Campi Custom
  campi: [CampoCustomSchema],
  
  // Workflow Stati
  stati: [StatoWorkflowSchema],
  statoIniziale: { type: String, required: true },
  
  // Permissions
  ruoliAccesso: [{
    ruolo: String,
    permessi: {
      visualizza: { type: Boolean, default: true },
      crea: { type: Boolean, default: false },
      modifica: { type: Boolean, default: false },
      elimina: { type: Boolean, default: false }
    }
  }],
  
  // UI Templates
  vistaLista: {
    tipo: { type: String, enum: ['table', 'cards', 'kanban'], default: 'cards' },
    campiVisibili: [String], // nomi dei campi da mostrare
    ordinamento: {
      campo: String,
      direzione: { type: String, enum: ['asc', 'desc'], default: 'desc' }
    }
  },
  
  // Settings
  abilitato: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ServiceTemplateSchema.index({ organizationId: 1, nome: 1 });

export default mongoose.models.ServiceTemplate || mongoose.model('ServiceTemplate', ServiceTemplateSchema);
```

#### 3. ServiceInstance (Istanza del Servizio)

```javascript
// models/ServiceInstance.js
import mongoose from 'mongoose';

const ServiceInstanceSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true 
  },
  
  serviceTemplateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServiceTemplate',
    required: true 
  },
  
  // Relazioni Base (comuni a tutti i servizi)
  cliente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Collaborazioni' // o Client generico
  },
  collaboratore: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Dati Custom (JSON flessibile)
  datiCustom: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Esempio datiCustom:
  // {
  //   budget_iniziale: 5000,
  //   scadenza: "2026-12-31",
  //   cliente_contattato: true,
  //   tipo_campagna: "search",
  //   note_interne: "Cliente vuole focus su mobile"
  // }
  
  // Workflow
  statoCorrente: { 
    type: String, 
    required: true 
  },
  storicoStati: [{
    stato: String,
    data: { type: Date, default: Date.now },
    utenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String
  }],
  
  // Metadata
  tags: [String],
  priorita: { 
    type: String, 
    enum: ['bassa', 'media', 'alta'],
    default: 'media' 
  },
  
  // Files allegati
  allegati: [{
    nome: String,
    url: String,
    tipo: String,
    dimensione: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Activity Log
  attivita: [{
    tipo: { type: String, enum: ['creazione', 'modifica', 'commento', 'stato_cambiato'] },
    descrizione: String,
    utenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    data: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes per performance
ServiceInstanceSchema.index({ organizationId: 1, serviceTemplateId: 1 });
ServiceInstanceSchema.index({ organizationId: 1, collaboratore: 1 });
ServiceInstanceSchema.index({ organizationId: 1, statoCorrente: 1 });

export default mongoose.models.ServiceInstance || mongoose.model('ServiceInstance', ServiceInstanceSchema);
```

#### 4. Modifica User per Multi-Org

```javascript
// models/User.js - MODIFICHE
const UserSchema = new mongoose.Schema({
  // ... campi esistenti ...
  
  // NUOVO: Multi-Organization Support
  organizations: [{
    organizationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Organization' 
    },
    ruolo: { 
      type: String, 
      enum: ['owner', 'admin', 'member'],
      default: 'member' 
    },
    subRoles: [String], // ruoli custom nell'org
    aggiunto: { type: Date, default: Date.now },
    attivo: { type: Boolean, default: true }
  }],
  
  // Organizzazione corrente (ultima selezionata)
  currentOrganizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  
  // ... resto dei campi esistenti ...
});
```

---

## 🔨 Fase 1: Multi-Tenancy Base

### Step 1.1: Setup Subdomain Routing

#### a) Configurazione Next.js

```javascript
// next.config.js - MODIFICA
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

#### b) Middleware per Subdomain Detection

```javascript
// middleware.js - SOVRASCRIVERE
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const hostname = request.headers.get('host') || '';
  
  // Estrai subdomain
  // es: "acme.tuodominio.com" → "acme"
  const subdomain = hostname.split('.')[0];
  
  // Domini speciali (non sono tenant)
  const specialDomains = ['www', 'api', 'admin', 'app'];
  
  if (specialDomains.includes(subdomain)) {
    // Landing page o area pubblica
    return NextResponse.next();
  }
  
  // Verifica se è un subdomain valido
  if (subdomain && subdomain !== 'localhost') {
    // Inietta subdomain nella request
    const response = NextResponse.next();
    response.headers.set('x-tenant-subdomain', subdomain);
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match tutte le routes tranne:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### c) Helper per Organization Context

```javascript
// lib/organizationContext.js - NUOVO FILE
import { headers } from 'next/headers';
import Organization from '@/models/Organization';
import { connectToDB } from '@/utils/database';

/**
 * Recupera l'organization dal subdomain della request
 * Da usare SOLO in Server Components o API Routes
 */
export async function getOrganizationFromRequest() {
  const headersList = headers();
  const subdomain = headersList.get('x-tenant-subdomain');
  
  if (!subdomain) {
    return null;
  }
  
  await connectToDB();
  
  const organization = await Organization.findOne({ 
    subdomain,
    attiva: true 
  });
  
  return organization;
}

/**
 * Helper per verificare che l'utente appartenga all'organization
 */
export async function verifyUserInOrganization(userId, organizationId) {
  await connectToDB();
  
  const User = (await import('@/models/User')).default;
  
  const user = await User.findOne({
    _id: userId,
    'organizations.organizationId': organizationId,
    'organizations.attivo': true
  });
  
  return !!user;
}

/**
 * Middleware helper per API routes
 */
export async function requireOrganization(req) {
  const organization = await getOrganizationFromRequest();
  
  if (!organization) {
    throw new Error('Organization not found');
  }
  
  return organization;
}
```

### Step 1.2: Sistema di Signup Multi-Org

#### a) Landing Page Pubblica

```javascript
// app/page.jsx - SOSTITUIRE (Landing Page)
import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, Shield, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">TuoSaaS</div>
        <div className="space-x-4">
          <Link href="/login">
            <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
              Accedi
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Inizia Gratis
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Gestisci i tuoi servizi<br/>
          in un unico posto
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Crea servizi personalizzati, assegna team, traccia progetti.
          Tutto configurabile secondo le tue esigenze.
        </p>
        <Link href="/signup">
          <button className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 flex items-center mx-auto">
            Prova Gratis per 14 giorni
            <ArrowRight className="ml-2" />
          </button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-bold mb-2">Veloce da configurare</h3>
          <p className="text-gray-600">
            Crea servizi custom in pochi minuti senza codice
          </p>
        </div>
        <div className="text-center p-6">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-bold mb-2">Sicuro e affidabile</h3>
          <p className="text-gray-600">
            I tuoi dati sono isolati e protetti
          </p>
        </div>
        <div className="text-center p-6">
          <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-bold mb-2">Collaborazione facile</h3>
          <p className="text-gray-600">
            Invita il team e assegna permessi granulari
          </p>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Prezzi Semplici</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="border-2 border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-4">€0</div>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                3 utenti
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                2 servizi custom
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                50 progetti
              </li>
            </ul>
            <Link href="/signup?plan=free">
              <button className="w-full py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                Inizia Gratis
              </button>
            </Link>
          </div>

          {/* Pro */}
          <div className="border-2 border-blue-600 rounded-lg p-8 relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm rounded-bl-lg">
              Popolare
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-4">
              €49<span className="text-lg text-gray-600">/mese</span>
            </div>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                15 utenti
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Servizi illimitati
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                500 progetti
              </li>
            </ul>
            <Link href="/signup?plan=pro">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Inizia Trial
              </button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="border-2 border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-4">Custom</div>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Utenti illimitati
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                White-label
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                API & Integrations
              </li>
            </ul>
            <Link href="/contact">
              <button className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Contattaci
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
```

#### b) Pagina Signup con Creazione Organization

```javascript
// app/signup/page.jsx - NUOVO FILE
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Mail, Lock, Globe } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planSelezionato = searchParams.get('plan') || 'free';

  const [step, setStep] = useState(1); // 1: org info, 2: user info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Organization Data
  const [orgData, setOrgData] = useState({
    nomeAzienda: '',
    subdomain: '',
    piano: planSelezionato
  });

  // Step 2: User Data (Owner)
  const [userData, setUserData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confermaPassword: ''
  });

  // Genera subdomain automatico dal nome azienda
  const handleNomeAziendaChange = (e) => {
    const nome = e.target.value;
    const subdomain = nome
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    
    setOrgData({ 
      ...orgData, 
      nomeAzienda: nome,
      subdomain: subdomain 
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validazioni
    if (userData.password !== userData.confermaPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (userData.password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signup-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: orgData,
          user: userData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la registrazione');
      }

      // Redirect al subdomain creato
      window.location.href = `http://${orgData.subdomain}.${window.location.hostname}/login?new=true`;

    } catch (err) {
      console.error('Errore signup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea il tuo Account
          </h1>
          <p className="text-gray-600">
            {step === 1 ? 'Iniziamo con la tua azienda' : 'Ora configura il tuo profilo'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup}>
          {step === 1 ? (
            // Step 1: Organization Info
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Nome Azienda
                </label>
                <input
                  type="text"
                  required
                  value={orgData.nomeAzienda}
                  onChange={handleNomeAziendaChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es: Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={orgData.subdomain}
                    onChange={(e) => setOrgData({ ...orgData, subdomain: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="acme"
                    pattern="[a-z0-9-]+"
                  />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                    .tuodominio.com
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solo lettere minuscole, numeri e trattini
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piano Selezionato
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-semibold text-blue-900 capitalize">
                    {orgData.piano}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continua
              </button>
            </div>
          ) : (
            // Step 2: User Info
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={userData.nome}
                    onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome
                  </label>
                  <input
                    type="text"
                    required
                    value={userData.cognome}
                    onChange={(e) => setUserData({ ...userData, cognome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conferma Password
                </label>
                <input
                  type="password"
                  required
                  value={userData.confermaPassword}
                  onChange={(e) => setUserData({ ...userData, confermaPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Indietro
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Creazione...' : 'Crea Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Hai già un account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### c) API per Signup Multi-Org

```javascript
// app/api/signup-organization/route.js - NUOVO FILE
import { NextResponse } from 'next/response';
import bcrypt from 'bcrypt';
import { connectToDB } from '@/utils/database';
import Organization from '@/models/Organization';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectToDB();

    const { organization, user } = await req.json();

    // Validazione subdomain
    const existingOrg = await Organization.findOne({ 
      subdomain: organization.subdomain 
    });

    if (existingOrg) {
      return NextResponse.json(
        { message: 'Questo subdomain è già in uso' },
        { status: 400 }
      );
    }

    // Validazione email
    const existingUser = await User.findOne({ email: user.email });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Questa email è già registrata' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 12);

    // Crea User (owner)
    const nuovoUser = await User.create({
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      password: hashedPassword,
      role: 'amministratore', // owner = admin nell'org
      subRoles: []
    });

    // Determina limiti basati sul piano
    const limiti = {
      free: { utenti: 3, servizi: 2, progetti: 50, storage: 1024 },
      starter: { utenti: 10, servizi: 10, progetti: 200, storage: 5120 },
      pro: { utenti: 50, servizi: -1, progetti: 1000, storage: 20480 },
      enterprise: { utenti: -1, servizi: -1, progetti: -1, storage: 102400 }
    };

    // Crea Organization
    const nuovaOrg = await Organization.create({
      nome: organization.nomeAzienda,
      subdomain: organization.subdomain,
      piano: organization.piano,
      limiti: limiti[organization.piano],
      owner: nuovoUser._id,
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 giorni
    });

    // Aggiorna User con organizationId
    await User.findByIdAndUpdate(nuovoUser._id, {
      organizations: [{
        organizationId: nuovaOrg._id,
        ruolo: 'owner',
        aggiunto: new Date(),
        attivo: true
      }],
      currentOrganizationId: nuovaOrg._id
    });

    // Crea servizi template di default (opzionale)
    // await createDefaultServices(nuovaOrg._id);

    return NextResponse.json({
      success: true,
      organization: {
        id: nuovaOrg._id,
        subdomain: nuovaOrg.subdomain
      },
      user: {
        id: nuovoUser._id,
        email: nuovoUser.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Errore signup organization:', error);
    return NextResponse.json(
      { message: 'Errore durante la creazione dell\'account', error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 1.3: Modifica Auth per Multi-Org

```javascript
// lib/auth.js - MODIFICARE
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { connectToDB } from "@/utils/database";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectToDB();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("Email o password non validi");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Email o password non validi");
        }

        // Trova l'organization corrente
        const currentOrg = user.currentOrganizationId 
          ? await Organization.findById(user.currentOrganizationId)
          : null;

        return {
          _id: user._id.toString(),
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          role: user.role,
          subRoles: user.subRoles || [],
          organizations: user.organizations || [],
          currentOrganizationId: user.currentOrganizationId?.toString(),
          currentOrganization: currentOrg ? {
            id: currentOrg._id.toString(),
            nome: currentOrg.nome,
            subdomain: currentOrg.subdomain,
            piano: currentOrg.piano
          } : null
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token._id = user._id;
        token.role = user.role;
        token.subRoles = user.subRoles;
        token.organizations = user.organizations;
        token.currentOrganizationId = user.currentOrganizationId;
        token.currentOrganization = user.currentOrganization;
      }

      // Update session se richiesto
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token._id;
        session.user.role = token.role;
        session.user.subRoles = token.subRoles;
        session.user.organizations = token.organizations;
        session.user.currentOrganizationId = token.currentOrganizationId;
        session.user.currentOrganization = token.currentOrganization;
      }
      return session;
    }
  },

  pages: {
    signIn: "/Login",
    error: "/Login"
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 giorni
  },

  secret: process.env.NEXTAUTH_SECRET
};
```

---

## 🎨 Fase 2: Sistema Servizi Dinamici

### Step 2.1: Service Template Builder

```javascript
// app/ServiceBuilder/page.jsx - NUOVO FILE
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Save, Trash2, GripVertical, Settings,
  Type, ToggleLeft, Calendar, Hash, FileText,
  Mail, Phone, Link as LinkIcon, Palette, Star
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TIPI_CAMPO = [
  { id: 'text', label: 'Testo', icon: Type },
  { id: 'textarea', label: 'Area Testo', icon: FileText },
  { id: 'number', label: 'Numero', icon: Hash },
  { id: 'currency', label: 'Valuta', icon: Hash },
  { id: 'boolean', label: 'Si/No', icon: ToggleLeft },
  { id: 'date', label: 'Data', icon: Calendar },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Telefono', icon: Phone },
  { id: 'url', label: 'Link', icon: LinkIcon },
  { id: 'color', label: 'Colore', icon: Palette },
  { id: 'rating', label: 'Valutazione', icon: Star },
];

export default function ServiceBuilderPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  // Step corrente
  const [step, setStep] = useState(1); // 1: Base, 2: Campi, 3: Stati, 4: Permessi

  // Dati servizio
  const [servizio, setServizio] = useState({
    nome: '',
    descrizione: '',
    icona: 'briefcase',
    colore: '#3B82F6',
    campi: [],
    stati: [
      { id: 'nuovo', etichetta: 'Nuovo', colore: '#6B7280', ordine: 0, transizioniPossibili: [] },
      { id: 'in_corso', etichetta: 'In Corso', colore: '#3B82F6', ordine: 1, transizioniPossibili: [] },
      { id: 'completato', etichetta: 'Completato', colore: '#10B981', ordine: 2, transizioniPossibili: [] }
    ],
    statoIniziale: 'nuovo'
  });

  // Aggiungi campo
  const aggiungiCampo = (tipo) => {
    const nuovoCampo = {
      id: `campo_${Date.now()}`,
      nome: '',
      etichetta: '',
      tipo: tipo,
      obbligatorio: false,
      ordine: servizio.campi.length,
      larghezza: 'full',
      placeholder: '',
      helpText: ''
    };

    setServizio({
      ...servizio,
      campi: [...servizio.campi, nuovoCampo]
    });
  };

  // Rimuovi campo
  const rimuoviCampo = (campoId) => {
    setServizio({
      ...servizio,
      campi: servizio.campi.filter(c => c.id !== campoId)
    });
  };

  // Aggiorna campo
  const aggiornaCampo = (campoId, dati) => {
    setServizio({
      ...servizio,
      campi: servizio.campi.map(c =>
        c.id === campoId ? { ...c, ...dati } : c
      )
    });
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(servizio.campi);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Aggiorna ordine
    items.forEach((item, index) => {
      item.ordine = index;
    });

    setServizio({ ...servizio, campi: items });
  };

  // Salva servizio
  const salvaServizio = async () => {
    // Validazione
    if (!servizio.nome) {
      alert('Inserisci un nome per il servizio');
      return;
    }

    if (servizio.campi.length === 0) {
      alert('Aggiungi almeno un campo al servizio');
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch('/api/service-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servizio)
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      alert('Servizio creato con successo!');
      router.push('/ServicesManager');

    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea Nuovo Servizio
          </h1>
          <p className="text-gray-600">
            Configura i campi e il workflow del tuo servizio personalizzato
          </p>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {['Base', 'Campi', 'Stati', 'Permessi'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > idx + 1 ? 'bg-green-500 text-white' :
                  step === idx + 1 ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{label}</span>
                {idx < 3 && <div className="w-12 h-1 mx-3 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Info Base */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Informazioni Base</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Servizio *
                </label>
                <input
                  type="text"
                  value={servizio.nome}
                  onChange={(e) => setServizio({ ...servizio, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="es: Google ADS, SEO, Sviluppo App"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={servizio.descrizione}
                  onChange={(e) => setServizio({ ...servizio, descrizione: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrivi questo servizio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore
                  </label>
                  <input
                    type="color"
                    value={servizio.colore}
                    onChange={(e) => setServizio({ ...servizio, colore: e.target.value })}
                    className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Campi */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Palette tipi campo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Aggiungi Campi</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {TIPI_CAMPO.map(tipo => {
                  const Icon = tipo.icon;
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => aggiungiCampo(tipo.id)}
                      className="p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                    >
                      <Icon className="w-6 h-6 mx-auto mb-1 text-gray-400 group-hover:text-blue-600" />
                      <span className="text-xs text-gray-600">{tipo.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista campi (drag & drop) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">
                Campi del Servizio ({servizio.campi.length})
              </h3>

              {servizio.campi.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Nessun campo aggiunto. Usa i pulsanti sopra per aggiungerne.
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="campi">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {servizio.campi.map((campo, index) => (
                          <Draggable key={campo.id} draggableId={campo.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="border-2 border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start space-x-4">
                                  {/* Drag handle */}
                                  <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                  </div>

                                  {/* Form campo */}
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Nome Tecnico
                                        </label>
                                        <input
                                          type="text"
                                          value={campo.nome}
                                          onChange={(e) => aggiornaCampo(campo.id, { nome: e.target.value })}
                                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                                          placeholder="es: budget_iniziale"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Etichetta
                                        </label>
                                        <input
                                          type="text"
                                          value={campo.etichetta}
                                          onChange={(e) => aggiornaCampo(campo.id, { etichetta: e.target.value })}
                                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                                          placeholder="es: Budget Iniziale"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                      <span className="text-xs text-gray-500">Tipo: <strong>{campo.tipo}</strong></span>
                                      <label className="flex items-center space-x-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={campo.obbligatorio}
                                          onChange={(e) => aggiornaCampo(campo.id, { obbligatorio: e.target.checked })}
                                          className="rounded"
                                        />
                                        <span>Obbligatorio</span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Delete */}
                                  <button
                                    onClick={() => rimuoviCampo(campo.id)}
                                    className="mt-2 p-2 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Indietro
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={servizio.campi.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stati (semplificato per brevità) */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Stati Workflow</h2>
            <p className="text-gray-600 mb-4">
              Gli stati di default sono già configurati. Puoi personalizzarli in seguito.
            </p>

            <div className="space-y-3">
              {servizio.stati.map(stato => (
                <div key={stato.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stato.colore }}
                  />
                  <span className="font-medium">{stato.etichetta}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Indietro
              </button>
              <button
                onClick={salvaServizio}
                disabled={salvando}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {salvando ? 'Salvataggio...' : 'Salva Servizio'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 2.2: API Service Templates

```javascript
// app/api/service-templates/route.js - NUOVO FILE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import ServiceTemplate from '@/models/ServiceTemplate';
import { requireOrganization } from '@/lib/organizationContext';

// GET - Lista service templates dell'organization
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();

    const organization = await requireOrganization(req);

    const templates = await ServiceTemplate.find({
      organizationId: organization._id,
      abilitato: true
    }).sort({ createdAt: -1 });

    return NextResponse.json(templates, { status: 200 });

  } catch (error) {
    console.error('Errore GET service templates:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei servizi', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo service template
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const organization = await requireOrganization(req);

    const dati = await req.json();

    // Verifica limiti piano
    if (organization.limiti.servizi !== -1) {
      const conteggioServizi = await ServiceTemplate.countDocuments({
        organizationId: organization._id,
        abilitato: true
      });

      if (conteggioServizi >= organization.limiti.servizi) {
        return NextResponse.json(
          { message: `Limite servizi raggiunto per il piano ${organization.piano}` },
          { status: 403 }
        );
      }
    }

    // Crea template
    const nuovoTemplate = await ServiceTemplate.create({
      organizationId: organization._id,
      nome: dati.nome,
      descrizione: dati.descrizione,
      icona: dati.icona,
      colore: dati.colore,
      campi: dati.campi,
      stati: dati.stati,
      statoIniziale: dati.statoIniziale,
      vistaLista: {
        tipo: 'cards',
        campiVisibili: dati.campi.slice(0, 3).map(c => c.nome)
      }
    });

    return NextResponse.json(nuovoTemplate, { status: 201 });

  } catch (error) {
    console.error('Errore POST service template:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione', error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 💳 Fase 4: Billing & Payments

### Step 4.1: Setup Stripe

```bash
npm install stripe @stripe/stripe-js
```

```javascript
// lib/stripe.js - NUOVO FILE
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['3 utenti', '2 servizi', '50 progetti']
  },
  starter: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER,
    features: ['10 utenti', '10 servizi', '200 progetti']
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRICE_PRO,
    features: ['50 utenti', 'Servizi illimitati', '1000 progetti']
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: ['Utenti illimitati', 'White-label', 'API Access']
  }
};
```

### Step 4.2: Webhook Stripe

```javascript
// app/api/webhooks/stripe/route.js - NUOVO FILE
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDB } from '@/utils/database';
import Organization from '@/models/Organization';

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  await connectToDB();

  // Handle event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      
      await Organization.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          piano: getPlanFromPriceId(subscription.items.data[0].price.id)
        }
      );
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      
      await Organization.findOneAndUpdate(
        { stripeCustomerId: deletedSub.customer },
        {
          subscriptionStatus: 'canceled',
          piano: 'free'
        }
      );
      break;
  }

  return NextResponse.json({ received: true });
}

function getPlanFromPriceId(priceId) {
  // Map price ID to plan name
  const mapping = {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise'
  };
  return mapping[priceId] || 'free';
}
```

---

## 📈 Pricing Strategy

### Modello Consigliato: Freemium + Tiered

```
FREE (€0)
- 3 utenti
- 2 servizi custom
- 50 progetti attivi
- Storage 1GB
- Support: Community

STARTER (€19/mese)
- 10 utenti
- 10 servizi custom
- 200 progetti attivi
- Storage 5GB
- Support: Email

PRO (€49/mese) ⭐ Most Popular
- 50 utenti
- Servizi illimitati
- 1000 progetti attivi
- Storage 20GB
- Priority support
- Custom branding

ENTERPRISE (€199/mese)
- Utenti illimitati
- Servizi illimitati
- Progetti illimitati
- Storage 100GB
- White-label completo
- API access
- Dedicated account manager
- SLA 99.9%
```

### Add-ons Opzionali

```
+€10/mese: 10 utenti extra
+€20/mese: 50GB storage extra
+€30/mese: Advanced analytics
+€15/mese: Automazioni avanzate
```

---

## 🔒 Sicurezza & Performance

### Checklist Sicurezza

```javascript
// Middleware di sicurezza per API
export async function securityMiddleware(req, session, organization) {
  // 1. Verifica utente appartiene all'org
  const belongsToOrg = session.user.organizations.some(
    org => org.organizationId === organization._id.toString()
  );

  if (!belongsToOrg) {
    throw new Error('Unauthorized: User not in organization');
  }

  // 2. Verifica limiti piano
  if (organization.subscriptionStatus !== 'active' && 
      organization.subscriptionStatus !== 'trial') {
    throw new Error('Subscription inactive');
  }

  // 3. Rate limiting (usa upstash/redis)
  // await checkRateLimit(session.user.id);

  return true;
}
```

### Database Indexes Critici

```javascript
// Indexes da creare per performance
db.serviceinstances.createIndex({ "organizationId": 1, "serviceTemplateId": 1 });
db.serviceinstances.createIndex({ "organizationId": 1, "collaboratore": 1 });
db.serviceinstances.createIndex({ "organizationId": 1, "statoCorrente": 1 });
db.organizations.createIndex({ "subdomain": 1 }, { unique: true });
db.users.createIndex({ "organizations.organizationId": 1 });
```

---

## 🚀 Migration Path (Dal Codice Esistente)

### Step 1: Backup Database

```bash
mongodump --uri="your_connection_string" --out=backup_pre_migration
```

### Step 2: Script di Migrazione

```javascript
// scripts/migrate-to-multitenant.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import Collaborazioni from '../models/Collaborazioni.js';
import GoogleAds from '../models/GoogleAds.js';
import Organization from '../models/Organization.js';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('🚀 Inizio migrazione...');

  // 1. Crea organization "default" per dati esistenti
  const defaultOrg = await Organization.create({
    nome: 'La Tua Azienda',
    subdomain: 'main',
    piano: 'enterprise',
    limiti: {
      utenti: -1,
      servizi: -1,
      progetti: -1,
      storage: 102400
    },
    owner: null, // verrà settato dopo
    subscriptionStatus: 'active'
  });

  console.log('✅ Organization creata:', defaultOrg._id);

  // 2. Migra tutti gli utenti
  const users = await User.find({});
  
  for (const user of users) {
    await User.findByIdAndUpdate(user._id, {
      organizations: [{
        organizationId: defaultOrg._id,
        ruolo: user.role === 'amministratore' ? 'owner' : 'member',
        subRoles: user.subRoles || [],
        aggiunto: user.createdAt,
        attivo: true
      }],
      currentOrganizationId: defaultOrg._id
    });
  }

  console.log(`✅ ${users.length} utenti migrati`);

  // 3. Setta owner dell'org (prima admin trovato)
  const primoAdmin = users.find(u => u.role === 'amministratore');
  if (primoAdmin) {
    await Organization.findByIdAndUpdate(defaultOrg._id, {
      owner: primoAdmin._id
    });
  }

  // 4. Aggiungi organizationId a tutte le collaborazioni
  await Collaborazioni.updateMany(
    {},
    { $set: { organizationId: defaultOrg._id } }
  );
  console.log('✅ Collaborazioni migrate');

  // 5. Converti GoogleAds in ServiceInstance (opzionale)
  // ... logica di conversione ...

  console.log('🎉 Migrazione completata!');
  
  mongoose.disconnect();
}

migrate().catch(console.error);
```

### Step 3: Esegui Migrazione

```bash
node scripts/migrate-to-multitenant.js
```

---

## 📝 TODO List Implementazione

### Settimana 1-2: Foundation
- [ ] Creare modelli Organization, ServiceTemplate, ServiceInstance
- [ ] Setup middleware subdomain routing
- [ ] Modificare User model per multi-org
- [ ] Aggiornare NextAuth per multi-org support

### Settimana 3-4: UI Base
- [ ] Landing page pubblica
- [ ] Signup flow multi-org
- [ ] Service Builder UI (step 1-2)
- [ ] Dashboard con organization switcher

### Settimana 5-6: Service Engine
- [ ] API per service templates (CRUD)
- [ ] API per service instances (CRUD)
- [ ] Rendering dinamico form
- [ ] Rendering dinamico liste/cards

### Settimana 7-8: Billing
- [ ] Setup Stripe account
- [ ] Pagina pricing
- [ ] Checkout flow
- [ ] Webhook handling
- [ ] Billing dashboard

### Settimana 9-10: Polish
- [ ] Onboarding wizard
- [ ] Usage limits enforcement
- [ ] Email notifications
- [ ] Analytics dashboard

### Settimana 11-12: Testing & Launch
- [ ] Test end-to-end
- [ ] Performance optimization
- [ ] Security audit
- [ ] Soft launch beta

---

## 🎯 KPI da Monitorare

```javascript
// Metrics da tracciare
{
  mrr: "Monthly Recurring Revenue",
  churn: "% utenti che cancellano",
  aktivUsers: "Utenti attivi ultimi 30gg",
  avgServices: "Media servizi per org",
  conversionRate: "Free → Paid %",
  ltv: "Lifetime Value cliente"
}
```

---

## 🤝 Supporto Clienti

### Help Center (FAQ Self-Service)

```markdown
# Come creo un servizio personalizzato?
1. Vai su "Impostazioni" → "Servizi"
2. Clicca "Nuovo Servizio"
3. Scegli nome e campi
4. Salva e inizia ad usarlo!

# Come invito un membro del team?
...
```

### Intercom / Chat Widget
- Installare widget per support real-time
- Bot automatico per FAQ comuni

---

## 💡 Features Future

- **Template Marketplace**: Vendi template pre-configurati ad altre org
- **Automazioni**: Zapier-like per trigger → azioni
- **Mobile App**: React Native app
- **API Pubblica**: Permetti integrazioni esterne
- **White-Label**: Custom domain per enterprise
- **Multi-language**: i18n completo
- **Advanced Analytics**: BI dashboard con grafici

---

## 🏁 Conclusione

Questo è un progetto ambizioso ma **assolutamente fattibile**. La tua base di codice è già solida e ben strutturata. 

**Stima realistica**: 
- **Solo** (1 dev full-time): 3-4 mesi
- **Team** (2-3 devs): 6-8 settimane

**Investment iniziale stimato**: €2,000-5,000
- Stripe fees
- Cloud hosting (Railway/Vercel/AWS)
- Domain + SSL
- Tools (email, analytics)

**ROI potenziale**:
- 100 clienti paganti (€49/mese) = €4,900/mese
- 500 clienti = €24,500/mese
- 1000 clienti = **€49,000/mese** 💰

Vuoi che iniziamo con la **Fase 1** implementando il multi-tenancy base?
