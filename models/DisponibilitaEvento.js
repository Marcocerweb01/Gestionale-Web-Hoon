import { Schema, model, models } from "mongoose";

const RispostaGiornalieraSchema = new Schema({
  data: { type: Date, required: true },
  stato: { type: String, enum: ["si", "no", "forse"], required: true },
  nota: { type: String, default: "", trim: true },
}, { _id: false });

const DisponibilitaEventoSchema = new Schema({
  evento: { type: Schema.Types.ObjectId, ref: "Evento", required: true, index: true },
  collaboratore: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true, index: true },
  stato: { type: String, enum: ["si", "no", "forse"], required: true },
  nota: { type: String, default: "", trim: true },
  risposteGiornaliere: { type: [RispostaGiornalieraSchema], default: [] },
}, { timestamps: true });

DisponibilitaEventoSchema.index({ evento: 1, collaboratore: 1 }, { unique: true });

export default models.DisponibilitaEvento || model("DisponibilitaEvento", DisponibilitaEventoSchema);
