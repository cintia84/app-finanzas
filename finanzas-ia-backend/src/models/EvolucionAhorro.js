import mongoose from "mongoose";

const evolucionAhorroSchema = new mongoose.Schema({
  mes: { type: String, required: true, unique: true },
  ahorroNeto: { type: Number, required: true }
});

export default mongoose.model("EvolucionAhorro", evolucionAhorroSchema);
