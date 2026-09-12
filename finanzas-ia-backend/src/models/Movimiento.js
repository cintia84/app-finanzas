import mongoose from "mongoose";

const movimientoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  id: { type: String, required: true },
  fecha: { type: String, required: true },
  comercio: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: String,
  cuenta: { type: String, required: true },
  medio: String,
  importe: { type: Number, required: true }
});

// El id (M00001, M00002...) ya no es único en TODA la colección, sino
// único POR usuario: dos usuarios distintos pueden tener cada uno su
// propio "M00001" sin chocar entre sí.
movimientoSchema.index({ usuarioId: 1, id: 1 }, { unique: true });

export default mongoose.model("Movimiento", movimientoSchema);
