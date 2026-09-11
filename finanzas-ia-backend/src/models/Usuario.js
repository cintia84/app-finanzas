import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  // Nunca guardamos la contraseña como te la mandan: guardamos su "hash"
  // (el resultado de una función que la mezcla sin poder revertirse)
  passwordHash: { type: String, required: true }
});

export default mongoose.model("Usuario", usuarioSchema);
