import mongoose from "mongoose";

const evolucionPatrimonioSchema = new mongoose.Schema({
  mes: { type: String, required: true, unique: true },
  patrimonioNeto: { type: Number, required: true }
});

export default mongoose.model("EvolucionPatrimonio", evolucionPatrimonioSchema);
