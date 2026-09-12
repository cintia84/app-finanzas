import mongoose from "mongoose";

// Subdocumentos: viven adentro del documento de Patrimonio, cada uno con
// su propio "id" para poder editarlos/borrarlos individualmente.
const activoSchema = new mongoose.Schema({ id: String, nombre: String, tipo: String, valor: Number, liquidez: String }, { _id: false });
const pasivoSchema = new mongoose.Schema({ id: String, nombre: String, tipo: String, saldo: Number }, { _id: false });
const inversionSchema = new mongoose.Schema({ id: String, nombre: String, tipo: String, valor: Number, rentabilidadMes: Number }, { _id: false });
const creditoSchema = new mongoose.Schema({
  id: String, tipo: String, institucion: String, saldoActual: Number,
  tasaAnual: Number, cuotasRestantes: Number, cuotaMensual: Number, destino: String
}, { _id: false });

const patrimonioSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  // "mes" ahora es solo informativo (última actualización); cada usuario
  // tiene UN SOLO documento de patrimonio, que va editando con el tiempo
  mes: { type: String, required: true },
  activos: [activoSchema],
  pasivos: [pasivoSchema],
  inversiones: [inversionSchema],
  creditos: [creditoSchema]
});

patrimonioSchema.index({ usuarioId: 1 }, { unique: true });

export default mongoose.model("Patrimonio", patrimonioSchema);
