import mongoose, { Schema, model, models } from 'mongoose';

const DominioSchema = new Schema(
  {
    urlDominio: { type: String, required: true, trim: true },
    dataScadenza: { type: Date, required: true },
    webDesigner: { type: String, required: true, trim: true }, // Nome del web designer
    isEsterno: { type: Boolean, default: false }, // Dominio non gestito internamente
    note: { type: String, default: '' },
    alertInviato: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Dominio = models.Dominio || model('Dominio', DominioSchema);

export default Dominio;
