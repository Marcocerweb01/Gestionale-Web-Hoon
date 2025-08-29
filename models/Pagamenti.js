import { Schema, model, models } from 'mongoose';

const PagamentiSchema = new Schema(
  {
    data_fattura: {
      type: Date,
      required: true,
    },
    data_pagato: {
      type: Date,
      default: null,
    },
    stato: {
      type: String,
      enum: ["si", "no", "ragazzi"],
      required: true,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Azienda",
      required: true,
    },
  },
  { timestamps: true }
);

const Pagamenti = models.Pagamenti || model("Pagamenti", PagamentiSchema);

export default Pagamenti;