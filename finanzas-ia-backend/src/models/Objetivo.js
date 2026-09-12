import mongoose from "mongoose";

const objetivoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  meta: { type: Number, required: true },
  acumulado: { type: Number, required: true }
});

objetivoSchema.index({ usuarioId: 1, id: 1 }, { unique: true });

export default mongoose.model("Objetivo", objetivoSchema);
