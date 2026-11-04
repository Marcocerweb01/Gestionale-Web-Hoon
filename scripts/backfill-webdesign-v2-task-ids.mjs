import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runTaskIdBackfill } from '../lib/webdesign-v2-task-backfill.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const dryRun = process.argv.includes('--dry-run');
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI non configurato');
  process.exit(1);
}
if (!dryRun && !process.argv.includes('--apply')) {
  console.error('Usa --dry-run per l’anteprima oppure --apply per eseguire il backfill.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Webarea' });
  const { default: CollaborazioneWebDesignV2 } = await import('../models/CollaborazioniWebDesignV2.js');
  const result = await runTaskIdBackfill({ collection: CollaborazioneWebDesignV2.collection, dryRun });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await mongoose.disconnect();
}
