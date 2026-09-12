import mongoose from "mongoose";

const evolucionAhorroSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  mes: { type: String, required: true },
  ahorroNeto: { type: Number, required: true }
});

evolucionAhorroSchema.index({ usuarioId: 1, mes: 1 }, { unique: true });

export default mongoose.model("EvolucionAhorro", evolucionAhorroSchema);
