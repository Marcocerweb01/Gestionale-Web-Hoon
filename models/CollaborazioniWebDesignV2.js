import mongoose, { Schema, model, models } from 'mongoose';

const TaskV2Schema = new Schema({
  giorno: { type: String, default: '' },
  nome: { type: String, required: true },
  descrizione: { type: String, default: '' },
  completata: { type: Boolean, default: false },
  note: { type: String, default: '' },
  appuntamentoTipo: { type: String, enum: ['', 'fisico', 'online'], default: '' },
  confermaGruppo: { type: Boolean, default: false }
}, { _id: false });

const FaseV2Schema = new Schema({
  nome: { type: String, enum: ['struttura', 'stile', 'design', 'consegna'], required: true },
  tasks: [TaskV2Schema],
  note: { type: String, default: '' }
}, { _id: false });

const ControlloV2Schema = new Schema({
  nome: { type: String, required: true },
  tasks: [TaskV2Schema],
  note: { type: String, default: '' }
}, { _id: false });

const FaseControlloV2Schema = new Schema({
  tipo: { type: String, required: true }, // "7gg", "14gg", "20gg", "21gg", "28gg", "consegna"
  giornoPrevisto: { type: Number, default: null },
  dataPrevista: { type: Date, default: null },
  data: { type: Date, default: null },
  stato: { type: String, enum: ['', 'da fare', 'in corso', 'ok', 'attenzione', 'critico'], default: '' },
  note: { type: String, default: '' },
  spuntiMiglioramento: { type: String, default: '' },
  completata: { type: Boolean, default: false }
}, { _id: false });

const ChecklistPubblicazioneV2Schema = new Schema({
  categoria: { type: String, required: true },
  items: [TaskV2Schema],
  note: { type: String, default: '' }
}, { _id: false });

const CollaborazioneWebDesignV2Schema = new Schema(
  {
    tipoProgetto: {
      type: String,
      enum: ['vetrina', 'e-commerce'],
      required: true,
    },
    cliente: { type: Schema.Types.ObjectId, ref: 'Azienda', required: true },
    webDesigner: { type: Schema.Types.ObjectId, ref: 'Collaboratore', required: true },
    aziendaRagioneSociale: { type: String, required: true },
    collaboratoreNome: { type: String, required: true },
    collaboratoreCognome: { type: String, required: true },
    fasi: [FaseV2Schema],
    controlli: [ControlloV2Schema],
    fasiControllo: [FaseControlloV2Schema],
    checklistPubblicazione: [ChecklistPubblicazioneV2Schema],
    note: { type: String, default: '' },
    stato: {
      type: String,
      enum: ['in corso', 'in pausa', 'terminata'],
      default: 'in corso',
    },
    dataInizioContratto: { type: Date, required: true },
    dataFineContratto: { type: Date, required: true },
    dominio: {
      dataAcquisto: { type: Date, default: null },
      dataScadenza: { type: Date, default: null },
      urlDominio: { type: String, default: '' },
      alertInviato: { type: Boolean, default: false },
      novaAlertData: { type: Date, default: null }
    },
  },
  { timestamps: true }
);

const CollaborazioneWebDesignV2 =
  models.CollaborazioneWebDesignV2 ||
  model('CollaborazioneWebDesignV2', CollaborazioneWebDesignV2Schema);

export default CollaborazioneWebDesignV2;
