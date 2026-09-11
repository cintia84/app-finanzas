import mongoose from "mongoose";

const cuentaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  banco: String,
  titular: String,
  saldo: { type: Number, required: true }
});

export default mongoose.model("Cuenta", cuentaSchema);
