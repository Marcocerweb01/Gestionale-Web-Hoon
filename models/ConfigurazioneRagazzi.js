import { Schema, model, models } from 'mongoose';

const ConfigurazioneRaggazziSchema = new Schema(
  {
    aziende_ragazzi: [{
      type: Schema.Types.ObjectId,
      ref: "Azienda"
    }]
  },
  { timestamps: true }
);

const ConfigurazioneRagazzi = models.ConfigurazioneRagazzi || model("ConfigurazioneRagazzi", ConfigurazioneRaggazziSchema);

export default ConfigurazioneRagazzi;
