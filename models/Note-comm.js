import { Schema, model, models } from 'mongoose';

const NoteCommSchema = new Schema({
  data: {
    type: Date,
    required: [true, 'Data nota'],
    default: Date.now,
  },
  nota: {
    type: String,
    required: [true, 'La nota è obbligatoria'],
  },
  autoreId: {
    type: Schema.Types.ObjectId,
    ref: "Utenti",
    required: true,
  },
  autore:{
    type: String,
    required:[false]
  },
  tipo: {
    type: String,
    enum: ['visita', 'appuntamento'],
    required: [true, 'Il tipo è obbligatorio'],
  },
  data_appuntamento: {
    type: Date,
    required: function () {
      return this.tipo === 'appuntamento';
    },
  },
});

const NotaComm = models.NotaComm || model('NotaComm', NoteCommSchema);
export default NotaComm;
