// Script per eseguire il cron job mensile
import fetch from 'node-fetch';

const RAILWAY_URL = process.env.RAILWAY_STATIC_URL || process.env.PUBLIC_URL || 'https://your-app.railway.app';

async function runMonthlyCron() {
  try {
    console.log('🕐 Eseguendo cron job mensile...');
    
    const response = await fetch(`${RAILWAY_URL}/api/cron-monthly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('✅ Cron job completato:', result);
    
  } catch (error) {
    console.error('❌ Errore cron job:', error);
    process.exit(1);
  }
}

runMonthlyCron();
