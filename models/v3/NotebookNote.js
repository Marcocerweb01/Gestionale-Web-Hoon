import { Schema, model, models } from "mongoose";

const NotebookNoteSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  autoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  visibilita: {
    type: String,
    enum: ["interna", "cliente", "team"],
    default: "team",
    index: true,
  },
  tipo: {
    type: String,
    enum: ["generale", "appuntamento", "problema", "decisione", "post_mancante", "follow_up"],
    default: "generale",
    index: true,
  },
  titolo: { type: String, default: "" },
  contenuto: { type: String, required: true },
  dataAppuntamento: { type: Date, default: null },
  statoProblema: {
    type: String,
    enum: ["", "aperto", "in_lavorazione", "risolto"],
    default: "",
  },
  feeling: {
    emoji: { type: String, default: "" },
    nota: { type: String, default: "" },
  },
  allegati: [{ type: Schema.Types.ObjectId, ref: "FileAssetV3" }],
  mentions: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
}, { timestamps: true });

NotebookNoteSchema.index({ agenziaId: 1, aziendaId: 1, createdAt: -1 });
NotebookNoteSchema.index({ collaborazioneId: 1, tipo: 1, createdAt: -1 });

export default models.NotebookNoteV3 || model("NotebookNoteV3", NotebookNoteSchema);
