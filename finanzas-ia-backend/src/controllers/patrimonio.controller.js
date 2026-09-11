import Patrimonio from "../models/Patrimonio.js";
import EvolucionPatrimonio from "../models/EvolucionPatrimonio.js";
import EvolucionAhorro from "../models/EvolucionAhorro.js";

export async function obtenerPatrimonio(req, res) {
  // Como solo guardamos un snapshot, traemos el más reciente por mes
  const patrimonio = await Patrimonio.findOne().sort({ mes: -1 }).select("-_id -__v");
  res.json(patrimonio);
}

export async function obtenerEvolucionPatrimonio(req, res) {
  const evolucion = await EvolucionPatrimonio.find().sort({ mes: 1 }).select("-_id -__v");
  res.json(evolucion);
}

export async function obtenerEvolucionAhorro(req, res) {
  const evolucion = await EvolucionAhorro.find().sort({ mes: 1 }).select("-_id -__v");
  res.json(evolucion);
}
