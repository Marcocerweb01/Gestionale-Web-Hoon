import { Schema, model, models } from 'mongoose';

const NoteCommSchema = new Schema({
  data: {
    type: Date,
    required: [true, 'Data nota'],
    default: Date.now,
  },
  mainCategoria: {
    type: String,
    enum: ['appuntamento', 'contatto'], // Soltanto "appuntamento" e "contatto"
    required: [true, 'La categoria principale è obbligatoria'],
  },
  tipoContatto: {
    type: String,
    enum: ['visita', 'chiamata'], // Tipi di contatto disponibili
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  comeArrivato: {
    type: String,
    enum: ['in azienda', 'chiamata', 'referal', 'ricerca'], // Come è arrivato il contatto
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  referal: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  nomeAzienda: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  luogo: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  indirizzo: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  numeroTelefono: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  referente: {
    type: String,
    required: function () {
      return this.mainCategoria === 'contatto'; // Obbligatorio solo per "contatto"
    },
  },
  nota: {
    type: String,
    required: [true, 'La nota è obbligatoria'], // Descrizione di cosa è successo
  },
  autoreId: {
    type: Schema.Types.ObjectId,
    ref: "Utenti",
    required: true,
  },
  autore: {
    type: String,
    required: false,
  },
  data_appuntamento: {
    type: Date,
    required: function () {
      return this.mainCategoria === 'appuntamento'; // Solo obbligatorio per "appuntamento"
    },
  },
});

const NotaComm = models.NotaComm || model('NotaComm', NoteCommSchema);
export default NotaComm;
