import { Schema, model, models } from 'mongoose';

const NoteSchema = new Schema({
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
  collaborazione: {
    type: Schema.Types.ObjectId,
    ref: "Collaborazioni",
    required: [true, 'La collaborazione è obbligatoria'],
  },
  tipo: {
    type: String,
    enum: ['generico', 'appuntamento', 'problema', 'post_mancante'],
    required: [true, 'Il tipo è obbligatorio'],
  },
  data_appuntamento: {
    type: Date,
    required: function () {
      return this.tipo === 'appuntamento';
    },
  },
  feeling_emoji: {
    type: String,
    enum: ['😄', '🙂', '😐', '😕', '😤', '😵💫', '🔥', '🧊', ''],
    default: '',
  },
  feeling_note: {
    type: String,
    default: '',
  },
});

const Nota = models.Nota || model('Nota', NoteSchema);
export default Nota;
