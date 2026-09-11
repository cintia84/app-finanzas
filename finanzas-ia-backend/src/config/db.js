import mongoose from "mongoose";

export async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB ✅");
  } catch (error) {
    console.error("No se pudo conectar a MongoDB ❌:", error.message);
    process.exit(1); // sin base de datos, no tiene sentido seguir corriendo
  }
}
