import mongoose from "mongoose";

const movimientoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fecha: { type: String, required: true },
  comercio: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: String,
  cuenta: { type: String, required: true },
  medio: String,
  importe: { type: Number, required: true }
});

export default mongoose.model("Movimiento", movimientoSchema);
