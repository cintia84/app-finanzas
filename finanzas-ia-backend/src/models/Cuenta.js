import mongoose from "mongoose";

const cuentaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  banco: String,
  titular: String,
  saldo: { type: Number, required: true }
});

cuentaSchema.index({ usuarioId: 1, id: 1 }, { unique: true });

export default mongoose.model("Cuenta", cuentaSchema);
