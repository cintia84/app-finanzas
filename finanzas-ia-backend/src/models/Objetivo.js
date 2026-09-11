import mongoose from "mongoose";

const objetivoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  meta: { type: Number, required: true },
  acumulado: { type: Number, required: true }
});

export default mongoose.model("Objetivo", objetivoSchema);
