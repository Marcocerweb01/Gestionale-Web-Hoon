/**
 * 🔍 Script di Diagnostica Automazioni
 * 
 * Controlla lo stato delle automazioni social e identifica problemi comuni
 * 
 * Uso:
 * node scripts/diagnose-automations.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';

const connectToDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// Colori per output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

async function main() {
  console.log('\n🔍 Diagnostica Automazioni Social\n');

  try {
    await connectToDB();
    log.success('Connesso al database MongoDB');

    // ━━━ CHECK 1: Account Social ━━━━━━━━━━━━━━━━━━━━━━━━━
    log.section('1. Account Social Connessi');
    
    const SocialAccount = (await import('../models/SocialAccount.js')).default;
    const accounts = await SocialAccount.find({}).lean();
    
    if (accounts.length === 0) {
      log.error('Nessun account social trovato nel database!');
      log.info('Soluzione: Vai su /Operations/SocialAutomation e connetti un account');
      return;
    }

    log.success(`Trovati ${accounts.length} account nel database`);
    
    accounts.forEach((account, i) => {
      console.log(`\n  ${i + 1}. ${account.displayName || account.username}`);
      console.log(`     ${colors.gray}Platform:${colors.reset} ${account.platform}`);
      console.log(`     ${colors.gray}Account ID:${colors.reset} ${account.accountId}`);
      console.log(`     ${colors.gray}Username:${colors.reset} @${account.username}`);
      console.log(`     ${colors.gray}Status:${colors.reset} ${account.status === 'active' ? colors.green : colors.red}${account.status}${colors.reset}`);
      
      // Check token expiry
      if (account.tokenExpiry) {
        const daysLeft = Math.ceil((new Date(account.tokenExpiry) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          log.error(`     Token SCADUTO da ${Math.abs(daysLeft)} giorni! Riconnetti l'account.`);
        } else if (daysLeft < 7) {
          log.warning(`     Token scade tra ${daysLeft} giorni. Considera di riconnettere.`);
        } else {
          console.log(`     ${colors.gray}Token scade tra:${colors.reset} ${daysLeft} giorni`);
        }
      }
    });

    // ━━━ CHECK 2: Automazioni ━━━━━━━━━━━━━━━━━━━━━━━━━━
    log.section('2. Automazioni Configurate');
    
    const SocialAutomation = (await import('../models/SocialAutomation.js')).default;
    const automations = await SocialAutomation.find({})
      .populate('accountId')
      .lean();
    
    if (automations.length === 0) {
      log.error('Nessuna automazione configurata!');
      log.info('Soluzione: Crea un\'automazione da /Operations/SocialAutomation/{accountId}/rules');
      return;
    }

    log.success(`Trovate ${automations.length} automazioni totali`);
    
    const activeAutomations = automations.filter(a => a.status === 'active');
    log.success(`${activeAutomations.length} automazioni ATTIVE`);
    
    if (activeAutomations.length === 0) {
      log.error('Nessuna automazione attiva! Tutte sono in pausa o draft.');
      log.info('Soluzione: Attiva almeno un\'automazione dall\'interfaccia');
    }

    automations.forEach((auto, i) => {
      const statusColor = auto.status === 'active' ? colors.green : colors.yellow;
      console.log(`\n  ${i + 1}. "${auto.name}"`);
      console.log(`     ${colors.gray}Account:${colors.reset} ${auto.accountId?.username || 'ACCOUNT CANCELLATO!'}`);
      console.log(`     ${colors.gray}Tipo:${colors.reset} ${auto.type}`);
      console.log(`     ${colors.gray}Status:${colors.reset} ${statusColor}${auto.status}${colors.reset}`);
      
      // Check keywords
      if (auto.trigger?.keywords?.length > 0) {
        console.log(`     ${colors.gray}Keywords:${colors.reset} ${auto.trigger.keywords.join(', ')}`);
      } else {
        log.warning('     Nessuna keyword → match TUTTI i commenti');
      }
      
      // Check message
      if (!auto.action?.message || auto.action.message.trim() === '') {
        log.error('     Messaggio vuoto! L\'automazione verrà skippata.');
      } else {
        console.log(`     ${colors.gray}Messaggio:${colors.reset} "${auto.action.message.substring(0, 50)}..."`);
      }
      
      // Check actionType
      if (!auto.action?.actionType) {
        log.warning('     actionType non impostato (default: send_dm)');
      } else {
        console.log(`     ${colors.gray}Azione:${colors.reset} ${auto.action.actionType}`);
      }
      
      // Stats
      if (auto.stats) {
        console.log(`     ${colors.gray}Stats:${colors.reset} ${auto.stats.triggered || 0} attivazioni, ${auto.stats.successful || 0} successi, ${auto.stats.failed || 0} errori`);
      }
      
      // Last triggered
      if (auto.lastTriggered) {
        const hoursAgo = Math.floor((new Date() - new Date(auto.lastTriggered)) / (1000 * 60 * 60));
        console.log(`     ${colors.gray}Ultima esecuzione:${colors.reset} ${hoursAgo}h fa`);
      } else {
        log.warning('     Mai eseguita!');
      }
    });

    // ━━━ CHECK 3: accountId Consistency ━━━━━━━━━━━━━━━━━━
    log.section('3. Verifica accountId');
    
    const accountIds = new Set(accounts.map(a => a.accountId));
    log.info(`Account IDs nel DB: ${Array.from(accountIds).join(', ')}`);
    
    log.info('\n📝 Quando Meta invia un webhook, controlla che il pageId corrisponda a uno di questi accountId.');
    log.info('   Se vedi "Account non trovato per pageId: XXXXX", quell\'ID non è nel DB.');
    
    // ━━━ CHECK 4: Configurazione Webhook ━━━━━━━━━━━━━━━━━
    log.section('4. Configurazione Webhook');
    
    const webhookUrl = process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL_PRODUCTION || 'NON IMPOSTATO';
    const webhookEndpoint = `${webhookUrl}/api/webhook/social`;
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    
    console.log(`  ${colors.gray}Webhook URL:${colors.reset} ${webhookEndpoint}`);
    
    if (!verifyToken) {
      log.error('META_WEBHOOK_VERIFY_TOKEN non impostato nel .env!');
    } else {
      log.success(`Verify Token: ${verifyToken.substring(0, 10)}...`);
    }
    
    // ━━━ CHECK 5: Test Connettività ━━━━━━━━━━━━━━━━━━━━━
    log.section('5. Test Connettività Webhook');
    
    try {
      const testChallenge = 'test123';
      const testUrl = `${webhookEndpoint}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${testChallenge}`;
      
      log.info(`Testing: ${testUrl}`);
      
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const text = await response.text();
        if (text === testChallenge) {
          log.success('Webhook risponde correttamente alla verifica Meta!');
        } else {
          log.error(`Webhook risponde ma con valore sbagliato: "${text}" (atteso: "${testChallenge}")`);
        }
      } else {
        log.error(`Webhook non raggiungibile! Status: ${response.status}`);
        log.info('Verifica che il server sia avviato e raggiungibile da internet.');
      }
    } catch (error) {
      log.error(`Impossibile contattare il webhook: ${error.message}`);
      if (webhookUrl.includes('localhost')) {
        log.warning('Stai usando localhost. Ricordati di usare ngrok per i test!');
        log.info('Comando: ngrok http 3000');
      }
    }

    // ━━━ RIEPILOGO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    log.section('📊 Riepilogo');
    
    let issues = 0;
    
    if (accounts.length === 0) {
      issues++;
      log.error('Nessun account connesso');
    }
    
    if (activeAutomations.length === 0) {
      issues++;
      log.error('Nessuna automazione attiva');
    }
    
    const expiredTokens = accounts.filter(a => 
      a.tokenExpiry && new Date(a.tokenExpiry) < new Date()
    );
    if (expiredTokens.length > 0) {
      issues++;
      log.error(`${expiredTokens.length} account con token scaduto`);
    }
    
    const automationsNoMessage = activeAutomations.filter(a => 
      !a.action?.message || a.action.message.trim() === ''
    );
    if (automationsNoMessage.length > 0) {
      issues++;
      log.error(`${automationsNoMessage.length} automazioni attive senza messaggio`);
    }
    
    const orphanAutomations = automations.filter(a => !a.accountId);
    if (orphanAutomations.length > 0) {
      issues++;
      log.error(`${orphanAutomations.length} automazioni senza account associato (account eliminato?)`);
    }
    
    if (!verifyToken) {
      issues++;
      log.error('META_WEBHOOK_VERIFY_TOKEN mancante');
    }
    
    console.log('\n');
    if (issues === 0) {
      log.success('✨ Tutto sembra configurato correttamente!');
      console.log('\nProssimi step:');
      console.log('1. Fai un commento su un post dell\'account Instagram');
      console.log('2. Controlla i log del server: tail -f logs.txt | grep WEBHOOK');
      console.log('3. Se non vedi nulla, controlla che il webhook sia sottoscritto:');
      console.log(`   curl -X POST ${webhookUrl}/api/social-accounts/ACCOUNT_ID/subscribe-webhook`);
    } else {
      log.error(`Trovati ${issues} problemi. Vedi dettagli sopra.`);
      console.log('\n📖 Consulta TROUBLESHOOTING_AUTOMAZIONI.md per le soluzioni.');
    }

  } catch (error) {
    log.error(`Errore durante la diagnostica: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n');
  }
}

main();
