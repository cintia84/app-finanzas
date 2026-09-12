import mongoose from "mongoose";

const evolucionPatrimonioSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  mes: { type: String, required: true },
  patrimonioNeto: { type: Number, required: true }
});

evolucionPatrimonioSchema.index({ usuarioId: 1, mes: 1 }, { unique: true });

export default mongoose.model("EvolucionPatrimonio", evolucionPatrimonioSchema);
