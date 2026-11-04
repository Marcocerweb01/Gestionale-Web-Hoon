import { Schema, model, models } from "mongoose";

const ChannelPreferenceSchema = new Schema({
  inApp: { type: Boolean, default: true },
  email: { type: Boolean, default: false },
}, { _id: false });

const AdminNotificationPreferenceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  userModel: {
    type: String,
    enum: ["Amministratore", "Collaboratore"],
    required: true,
  },
  preferences: {
    type: Map,
    of: ChannelPreferenceSchema,
    default: {},
  },
}, { timestamps: true });

AdminNotificationPreferenceSchema.index({ userId: 1, userModel: 1 }, { unique: true });

export default models.AdminNotificationPreference
  || model("AdminNotificationPreference", AdminNotificationPreferenceSchema);
