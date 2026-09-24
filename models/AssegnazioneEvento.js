import { Schema, model, models } from "mongoose";

const AssegnazioneEventoSchema = new Schema({
  evento: { type: Schema.Types.ObjectId, ref: "Evento", required: true, index: true },
  collaboratore: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true, index: true },
  dataLavoro: { type: Date, required: true, index: true },
  mansione: { type: String, required: true, trim: true },
  noteCollaboratore: { type: String, default: "" },
  createdBy: { type: String, default: "" },
  updatedBy: { type: String, default: "" },
}, { timestamps: true });

AssegnazioneEventoSchema.index({ evento: 1, dataLavoro: 1, collaboratore: 1 });

export default models.AssegnazioneEvento || model("AssegnazioneEvento", AssegnazioneEventoSchema);
