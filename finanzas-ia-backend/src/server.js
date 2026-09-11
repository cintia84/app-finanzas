import "dotenv/config";
import express from "express";
import cors from "cors";
import { conectarDB } from "./config/db.js";
import { verificarToken } from "./middlewares/auth.middleware.js";
import authRouter from "./routes/auth.routes.js";
import movimientosRouter from "./routes/movimientos.routes.js";
import cuentasRouter from "./routes/cuentas.routes.js";
import objetivosRouter from "./routes/objetivos.routes.js";
import patrimonioRouter from "./routes/patrimonio.routes.js";

const app = express();
const PUERTO = process.env.PORT || process.env.PUERTO || 3000;

app.use(express.json());
app.use(cors());

// Rutas públicas: cualquiera puede registrarse o loguearse sin token
app.use("/api/auth", authRouter);

// A partir de acá, TODAS las rutas necesitan un token válido.
// Este middleware se ejecuta antes que cualquiera de los routers de abajo.
app.use("/api", verificarToken);

app.use("/api/movimientos", movimientosRouter);
app.use("/api/cuentas", cuentasRouter);
app.use("/api/objetivos", objetivosRouter);
app.use("/api/patrimonio", patrimonioRouter);

app.get("/", (req, res) => {
  res.send("Backend de Finanzas IA funcionando 🚀");
});

conectarDB().then(() => {
  app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
  });
});
