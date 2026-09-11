import mongoose from "mongoose";

// Estos cuatro son "subdocumentos": no tienen su propia colección,
// viven adentro del documento de Patrimonio.
const activoSchema = new mongoose.Schema({ nombre: String, tipo: String, valor: Number, liquidez: String }, { _id: false });
const pasivoSchema = new mongoose.Schema({ nombre: String, tipo: String, saldo: Number }, { _id: false });
const inversionSchema = new mongoose.Schema({ nombre: String, tipo: String, valor: Number, rentabilidadMes: Number }, { _id: false });
const creditoSchema = new mongoose.Schema({
  id: String, tipo: String, institucion: String, saldoActual: Number,
  tasaAnual: Number, cuotasRestantes: Number, cuotaMensual: Number, destino: String
}, { _id: false });

const patrimonioSchema = new mongoose.Schema({
  mes: { type: String, required: true, unique: true },
  activos: [activoSchema],
  pasivos: [pasivoSchema],
  inversiones: [inversionSchema],
  creditos: [creditoSchema]
});

export default mongoose.model("Patrimonio", patrimonioSchema);
