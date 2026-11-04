import { Schema, model, models } from "mongoose";

const NotificationLegacyDismissalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  legacySourceId: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });

NotificationLegacyDismissalSchema.index(
  { userId: 1, legacySourceId: 1 },
  { unique: true }
);

export default models.NotificationLegacyDismissal
  || model("NotificationLegacyDismissal", NotificationLegacyDismissalSchema);
