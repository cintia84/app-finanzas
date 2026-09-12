import Patrimonio from "../models/Patrimonio.js";
import EvolucionPatrimonio from "../models/EvolucionPatrimonio.js";
import EvolucionAhorro from "../models/EvolucionAhorro.js";

// Patrimonio es "tu estado actual": un solo documento por usuario, que
// se va editando con el tiempo (no un historial mensual que vos cargues).
// Si todavía no existe ninguno para este usuario, se crea uno vacío.
async function obtenerOCrearPatrimonioActual(usuarioId) {
  let patrimonio = await Patrimonio.findOne({ usuarioId });

  if (!patrimonio) {
    const mesActual = new Date().toISOString().slice(0, 7); // "2026-12"
    patrimonio = await Patrimonio.create({
      usuarioId, mes: mesActual, activos: [], pasivos: [], inversiones: [], creditos: []
    });
  }

  return patrimonio;
}

function generarId(prefijo, lista) {
  return `${prefijo}${String(lista.length + 1).padStart(3, "0")}`;
}

export async function obtenerPatrimonio(req, res) {
  const patrimonio = await obtenerOCrearPatrimonioActual(req.usuario.id);
  const { _id, __v, usuarioId, ...datosLimpios } = patrimonio.toObject();
  res.json(datosLimpios);
}

export async function obtenerEvolucionPatrimonio(req, res) {
  const evolucion = await EvolucionPatrimonio.find({ usuarioId: req.usuario.id })
    .sort({ mes: 1 })
    .select("-_id -__v -usuarioId");
  res.json(evolucion);
}

export async function obtenerEvolucionAhorro(req, res) {
  const evolucion = await EvolucionAhorro.find({ usuarioId: req.usuario.id })
    .sort({ mes: 1 })
    .select("-_id -__v -usuarioId");
  res.json(evolucion);
}

// ---------- Fábrica de controllers CRUD para un tipo de ítem ----------
// activos, pasivos, inversiones y créditos se manejan todos igual: agregar
// al array, buscar por id y actualizar, o buscar por id y sacar. En vez de
// repetir el mismo código 4 veces, lo armamos una sola vez acá.
function crearControladorDeItems({ campo, prefijoId, camposRequeridos, camposPermitidos }) {
  function armarItem(body) {
    const item = {};
    for (const c of camposPermitidos) {
      if (body[c] !== undefined) item[c] = body[c];
    }
    return item;
  }

  function validar(body) {
    const faltantes = camposRequeridos.filter(c => body[c] === undefined || body[c] === "");
    if (faltantes.length > 0) {
      return `Faltan campos obligatorios: ${faltantes.join(", ")}.`;
    }
    return null;
  }

  return {
    async agregar(req, res) {
      const errorValidacion = validar(req.body);
      if (errorValidacion) return res.status(400).json({ error: errorValidacion });

      const patrimonio = await obtenerOCrearPatrimonioActual(req.usuario.id);
      const nuevoItem = { id: generarId(prefijoId, patrimonio[campo]), ...armarItem(req.body) };
      patrimonio[campo].push(nuevoItem);
      await patrimonio.save();
      res.status(201).json(nuevoItem);
    },

    async actualizar(req, res) {
      const errorValidacion = validar(req.body);
      if (errorValidacion) return res.status(400).json({ error: errorValidacion });

      const patrimonio = await obtenerOCrearPatrimonioActual(req.usuario.id);
      const item = patrimonio[campo].find(i => i.id === req.params.id);

      if (!item) {
        return res.status(404).json({ error: `No existe un ítem con id ${req.params.id}.` });
      }

      Object.assign(item, armarItem(req.body));
      await patrimonio.save();
      res.json(item);
    },

    async eliminar(req, res) {
      const patrimonio = await obtenerOCrearPatrimonioActual(req.usuario.id);
      const cantidadAntes = patrimonio[campo].length;
      patrimonio[campo] = patrimonio[campo].filter(i => i.id !== req.params.id);

      if (patrimonio[campo].length === cantidadAntes) {
        return res.status(404).json({ error: `No existe un ítem con id ${req.params.id}.` });
      }

      await patrimonio.save();
      res.json({ mensaje: "Eliminado.", id: req.params.id });
    }
  };
}

export const controladorActivos = crearControladorDeItems({
  campo: "activos",
  prefijoId: "A",
  camposRequeridos: ["nombre", "tipo", "valor"],
  camposPermitidos: ["nombre", "tipo", "valor", "liquidez"]
});

export const controladorPasivos = crearControladorDeItems({
  campo: "pasivos",
  prefijoId: "P",
  camposRequeridos: ["nombre", "tipo", "saldo"],
  camposPermitidos: ["nombre", "tipo", "saldo"]
});

export const controladorInversiones = crearControladorDeItems({
  campo: "inversiones",
  prefijoId: "I",
  camposRequeridos: ["nombre", "tipo", "valor"],
  camposPermitidos: ["nombre", "tipo", "valor", "rentabilidadMes"]
});

export const controladorCreditos = crearControladorDeItems({
  campo: "creditos",
  prefijoId: "CR",
  camposRequeridos: ["tipo", "institucion", "saldoActual", "cuotaMensual"],
  camposPermitidos: [
    "tipo", "institucion", "saldoActual", "tasaAnual",
    "cuotasRestantes", "cuotaMensual", "destino"
  ]
});
