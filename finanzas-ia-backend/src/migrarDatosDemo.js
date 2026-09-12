import "dotenv/config";
import mongoose from "mongoose";
import { conectarDB } from "./config/db.js";
import Usuario from "./models/Usuario.js";
import Movimiento from "./models/Movimiento.js";
import Cuenta from "./models/Cuenta.js";
import Objetivo from "./models/Objetivo.js";
import Patrimonio from "./models/Patrimonio.js";
import EvolucionPatrimonio from "./models/EvolucionPatrimonio.js";
import EvolucionAhorro from "./models/EvolucionAhorro.js";

// Se ejecuta así: node src/migrarDatosDemo.js nombreDeUsuario
const nombreUsuario = process.argv[2];

async function eliminarIndiceSiExiste(coleccion, nombreIndice) {
  try {
    await coleccion.dropIndex(nombreIndice);
    console.log(`  Índice viejo "${nombreIndice}" eliminado de ${coleccion.collectionName}`);
  } catch (error) {
    // Si el índice no existe, Mongo tira un error que acá ignoramos a propósito
    console.log(`  (${coleccion.collectionName}: no había índice "${nombreIndice}" para borrar)`);
  }
}

async function migrar() {
  if (!nombreUsuario) {
    console.error("Uso: node src/migrarDatosDemo.js tu_nombre_de_usuario");
    process.exit(1);
  }

  await conectarDB();

  const usuario = await Usuario.findOne({ usuario: nombreUsuario });
  if (!usuario) {
    console.error(`No existe ningún usuario con el nombre "${nombreUsuario}".`);
    process.exit(1);
  }

  console.log(`Asignando todos los datos existentes a "${usuario.usuario}" (${usuario._id})...\n`);

  // 1) Borramos los índices únicos VIEJOS (de antes de tener usuarioId),
  // porque chocarían con los nuevos índices compuestos
  console.log("Limpiando índices viejos:");
  await eliminarIndiceSiExiste(Movimiento.collection, "id_1");
  await eliminarIndiceSiExiste(Cuenta.collection, "id_1");
  await eliminarIndiceSiExiste(Objetivo.collection, "id_1");
  await eliminarIndiceSiExiste(Patrimonio.collection, "mes_1");
  await eliminarIndiceSiExiste(EvolucionPatrimonio.collection, "mes_1");
  await eliminarIndiceSiExiste(EvolucionAhorro.collection, "mes_1");

  // 2) Le asignamos el usuarioId a todo lo que todavía no lo tenga
  console.log("\nAsignando dueño a los documentos existentes:");
  const resultados = await Promise.all([
    Movimiento.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id }),
    Cuenta.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id }),
    Objetivo.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id }),
    Patrimonio.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id }),
    EvolucionPatrimonio.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id }),
    EvolucionAhorro.updateMany({ usuarioId: { $exists: false } }, { usuarioId: usuario._id })
  ]);

  const nombres = ["Movimientos", "Cuentas", "Objetivos", "Patrimonio", "EvolucionPatrimonio", "EvolucionAhorro"];
  resultados.forEach((r, i) => console.log(`  ${nombres[i]}: ${r.modifiedCount} actualizados`));

  // 3) Creamos los índices nuevos (por si no se crearon solos todavía)
  console.log("\nCreando índices nuevos...");
  await Movimiento.syncIndexes();
  await Cuenta.syncIndexes();
  await Objetivo.syncIndexes();
  await Patrimonio.syncIndexes();
  await EvolucionPatrimonio.syncIndexes();
  await EvolucionAhorro.syncIndexes();

  console.log("\n✅ Migración completa.");
  await mongoose.disconnect();
}

migrar();
