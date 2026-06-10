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

const InterviewV2Schema = new Schema({
  azienda: { type: String, default: '' },
  descrizioneAzienda: { type: String, default: '' },
  servizioPrincipale: { type: String, default: '' },
  serviziSpingere: { type: String, default: '' },
  clienteIdeale: { type: String, default: '' },
  provenienzaClienti: { type: String, default: '' },
  obiettivoSito: { type: String, default: '' },
  utenteCosaFare: { type: String, default: '' },
  callToAction: { type: String, default: '' },
  tipoSito: { type: String, default: '' },
  sezioni: { type: String, default: '' },
  pagine: { type: String, default: '' },
  serviziEvidenza: { type: String, default: '' },
  recensioniClienti: { type: String, default: '' },
  lavoriProgetti: { type: String, default: '' },
  sitiRiferimento: { type: String, default: '' },
  sitiNonPiacciono: { type: String, default: '' },
  stilePreferito: { type: String, default: '' },
  tipologiaSito: { type: String, default: '' },
  animazioni: { type: String, default: '' },
  videoHomepage: { type: String, default: '' },
  preferenzeColori: { type: String, default: '' },
  preferenzeFont: { type: String, default: '' },
  haLineeGuidaBrand: { type: String, default: 'no' },
  lineeGuidaBrand: { type: String, default: '' },
  haDominio: { type: String, default: 'no' },
  dominio: { type: String, default: '' },
  servizioDominio: { type: String, default: '' },
  mailCollegate: { type: String, default: '' },
  accessiDominio: { type: String, default: '' },
  noteAccessi: { type: String, default: '' },
  scadenzaDominio: { type: String, default: '' },
  branding: { type: String, default: '' },
  media: { type: String, default: '' },
  testi: { type: String, default: '' },
  noteMateriali: { type: String, default: '' },
  fileUtili: { type: String, default: '' }
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
    interview: InterviewV2Schema,
    interviewPrompt: { type: String, default: '' },
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
