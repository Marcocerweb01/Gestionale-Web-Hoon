import { Schema, model, models } from 'mongoose';

const NotificaSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ['nota_problema', 'dominio_scadenza', 'fine_mese', 'evento_disponibilita', 'shooting_disponibilita', 'seo_assegnazione', 'commerciale', 'report_chiusura'],
      required: true,
    },
    titolo: { type: String, required: true },
    messaggio: { type: String, required: true },
    letta: { type: Boolean, default: false },
    link: { type: String, default: '' },
    // Metadati extra per evitare duplicati
    refId: { type: String, default: '' }, // es. id nota o id dominio
    legacySourceId: { type: Schema.Types.ObjectId, default: null, index: true },
    destinatario: { type: Schema.Types.ObjectId, default: null, index: true },
    destinatarioModel: {
      type: String,
      enum: ['Amministratore', 'Collaboratore'],
      default: 'Collaboratore',
    },
  },
  { timestamps: true }
);

NotificaSchema.index(
  { destinatario: 1, legacySourceId: 1 },
  { unique: true, partialFilterExpression: { legacySourceId: { $type: 'objectId' } } }
);

const Notifica = models.Notifica || model('Notifica', NotificaSchema);

export default Notifica;
