import "dotenv/config";
import { conectarDB } from "./config/db.js";
import { leerDatos } from "./utils/leerDatos.js";
import mongoose from "mongoose";

import Movimiento from "./models/Movimiento.js";
import Cuenta from "./models/Cuenta.js";
import Objetivo from "./models/Objetivo.js";
import Patrimonio from "./models/Patrimonio.js";
import EvolucionPatrimonio from "./models/EvolucionPatrimonio.js";
import EvolucionAhorro from "./models/EvolucionAhorro.js";

async function importar() {
  await conectarDB();
  const datos = await leerDatos();

  // Borramos lo que hubiera antes, para que correr el script dos veces
  // no duplique todo
  await Promise.all([
    Movimiento.deleteMany({}),
    Cuenta.deleteMany({}),
    Objetivo.deleteMany({}),
    Patrimonio.deleteMany({}),
    EvolucionPatrimonio.deleteMany({}),
    EvolucionAhorro.deleteMany({})
  ]);

  await Movimiento.insertMany(datos.movimientos);
  await Cuenta.insertMany(datos.cuentas);
  await Objetivo.insertMany(datos.objetivos);
  await Patrimonio.create(datos.patrimonio);
  await EvolucionPatrimonio.insertMany(datos.evolucionPatrimonio);
  await EvolucionAhorro.insertMany(datos.evolucionAhorro);

  console.log("Importación completa ✅");
  console.log("- Movimientos:", datos.movimientos.length);
  console.log("- Cuentas:", datos.cuentas.length);
  console.log("- Objetivos:", datos.objetivos.length);
  console.log("- Evolución patrimonio:", datos.evolucionPatrimonio.length);
  console.log("- Evolución ahorro:", datos.evolucionAhorro.length);

  await mongoose.disconnect();
}

importar();
