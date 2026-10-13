import mongoose, { Schema, model, models } from 'mongoose';

const TaskV2Schema = new Schema({
  codice: { type: String, default: '' },
  giorno: { type: String, default: '' },
  giornoLavorativo: { type: Number, default: null },
  nome: { type: String, required: true },
  descrizione: { type: String, default: '' },
  stato: {
    type: String,
    enum: ['da fare', 'in corso', 'in attesa', 'completata', 'non applicabile'],
    default: 'da fare',
  },
  criticita: {
    type: String,
    enum: ['regolare', 'attenzione', 'critico'],
    default: 'regolare',
  },
  motivoRitardo: {
    type: String,
    enum: ['', 'ritardo interno', 'attesa cliente', 'mancanza contenuti', 'attesa approvazione', 'problema tecnico', 'altro'],
    default: '',
  },
  tipoControllo: { type: String, enum: ['', 'obbligatorio', 'condizionale', 'non applicabile'], default: '' },
  faseCollegata: { type: String, enum: ['', 'struttura', 'design', 'consegna', 'pubblicazione'], default: '' },
  completata: { type: Boolean, default: false },
  note: { type: String, default: '' },
  appuntamentoTipo: { type: String, enum: ['', 'fisico', 'online'], default: '' },
  confermaGruppo: { type: Boolean, default: false }
}, { _id: false });

const FaseV2Schema = new Schema({
  nome: { type: String, enum: ['struttura', 'stile', 'design', 'consegna'], required: true },
  giornoInizio: { type: Number, default: null },
  giornoFine: { type: Number, default: null },
  dataInizioPrevista: { type: Date, default: null },
  dataFinePrevista: { type: Date, default: null },
  controlloTipo: { type: String, default: '' },
  stato: {
    type: String,
    enum: ['da fare', 'in corso', 'in attesa', 'completata', 'non applicabile'],
    default: 'da fare',
  },
  criticita: {
    type: String,
    enum: ['regolare', 'attenzione', 'critico'],
    default: 'regolare',
  },
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
  stato: { type: String, enum: ['', 'da fare', 'in corso', 'completato', 'ok', 'attenzione', 'critico', 'non applicabile'], default: '' },
  esito: { type: String, enum: ['', 'superato', 'non superato', 'con riserva', 'non applicabile'], default: '' },
  note: { type: String, default: '' },
  spuntiMiglioramento: { type: String, default: '' },
  anomalie: { type: String, default: '' },
  problemiBloccanti: { type: String, default: '' },
  completata: { type: Boolean, default: false },
  checkboxCompletamento: { type: Boolean, default: false },
  condizionale: { type: Boolean, default: false },
  eccezioneAutorizzata: { type: Boolean, default: false },
  eccezioneAutorizzataDa: { type: String, default: '' },
  eccezioneMotivo: { type: String, default: '' },
  eccezioneData: { type: Date, default: null }
}, { _id: false });

const ChecklistPubblicazioneV2Schema = new Schema({
  categoria: { type: String, required: true },
  items: [TaskV2Schema],
  note: { type: String, default: '' }
}, { _id: false });

const AppuntamentoV2Schema = new Schema({
  tipo: { type: String, enum: ['iniziale', 'intermedio', 'finale'], required: true },
  obbligatorio: { type: Boolean, default: false },
  stato: { type: String, enum: ['da pianificare', 'programmato', 'effettuato', 'saltato', 'facoltativo'], default: 'da pianificare' },
  data: { type: Date, default: null },
  modalita: { type: String, enum: ['', 'presenza', 'videocall', 'telefono', 'altro'], default: '' },
  esito: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

const ApprovazioneV2Schema = new Schema({
  tipo: { type: String, enum: ['struttura', 'design', 'consegna'], required: true },
  stato: { type: String, enum: ['da richiedere', 'richiesta', 'approvata', 'respinta', 'non applicabile'], default: 'da richiedere' },
  modalita: { type: String, enum: ['', 'asincrona', 'presenza', 'videocall', 'altro'], default: '' },
  data: { type: Date, default: null },
  approvatoDa: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

const ConsegnaV2Schema = new Schema({
  stato: { type: String, enum: ['non consegnato', 'pronta', 'bloccata', 'consegnato'], default: 'non consegnato' },
  dataPrevista: { type: Date, default: null },
  dataEffettiva: { type: Date, default: null },
  confermata: { type: Boolean, default: false },
  note: { type: String, default: '' },
}, { _id: false });

const PubblicazioneV2Schema = new Schema({
  stato: {
    type: String,
    enum: ['non prevista', 'da pianificare', 'programmata', 'in corso', 'pubblicata', 'bloccata'],
    default: 'da pianificare',
  },
  dataPrevista: { type: Date, default: null },
  dataEffettiva: { type: Date, default: null },
  urlPubblico: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

const ModificaTimelineV2Schema = new Schema({
  dataPrecedente: { type: Date, default: null },
  dataNuova: { type: Date, required: true },
  dataFinePrecedente: { type: Date, default: null },
  dataFineNuova: { type: Date, required: true },
  modificataIl: { type: Date, required: true },
  modificataDaId: { type: String, default: '' },
  modificataDaNome: { type: String, default: '' },
  motivo: { type: String, default: '' },
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
    workflowVersion: { type: String, default: null },
    workflowTimezone: { type: String, default: 'Europe/Rome' },
    dataAvvioOperativo: { type: Date, default: null },
    intervistaRicevutaAt: { type: Date, default: null },
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
    appuntamenti: [AppuntamentoV2Schema],
    approvazioni: [ApprovazioneV2Schema],
    consegna: { type: ConsegnaV2Schema, default: () => ({}) },
    pubblicazione: { type: PubblicazioneV2Schema, default: () => ({}) },
    modificheTimeline: [ModificaTimelineV2Schema],
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
