import mongoose, { Schema, model, models } from 'mongoose';

const NotificaSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ['nota_problema', 'dominio_scadenza', 'fine_mese'],
      required: true,
    },
    titolo: { type: String, required: true },
    messaggio: { type: String, required: true },
    letta: { type: Boolean, default: false },
    link: { type: String, default: '' },
    // Metadati extra per evitare duplicati
    refId: { type: String, default: '' }, // es. id nota o id dominio
  },
  { timestamps: true }
);

const Notifica = models.Notifica || model('Notifica', NotificaSchema);

export default Notifica;
