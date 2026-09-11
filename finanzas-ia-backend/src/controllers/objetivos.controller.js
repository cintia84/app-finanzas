import Objetivo from "../models/Objetivo.js";

export async function obtenerObjetivos(req, res) {
  const objetivos = await Objetivo.find().select("-_id -__v");
  res.json(objetivos);
}

export async function crearObjetivo(req, res) {
  const { nombre, meta, acumulado } = req.body;

  try {
    const cantidad = await Objetivo.countDocuments();
    const nuevoId = `O${String(cantidad + 1).padStart(3, "0")}`;

    const nuevoObjetivo = await Objetivo.create({
      id: nuevoId,
      nombre,
      meta: Number(meta),
      acumulado: Number(acumulado)
    });
    res.status(201).json(nuevoObjetivo);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el objetivo." });
  }
}

export async function actualizarObjetivo(req, res) {
  const { nombre, meta, acumulado } = req.body;

  try {
    const objetivo = await Objetivo.findOneAndUpdate(
      { id: req.params.id },
      { nombre, meta: Number(meta), acumulado: Number(acumulado) },
      { new: true }
    ).select("-_id -__v");

    if (!objetivo) {
      return res.status(404).json({ error: `No existe un objetivo con id ${req.params.id}.` });
    }
    res.json(objetivo);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el objetivo." });
  }
}

export async function eliminarObjetivo(req, res) {
  try {
    const objetivo = await Objetivo.findOneAndDelete({ id: req.params.id });
    if (!objetivo) {
      return res.status(404).json({ error: `No existe un objetivo con id ${req.params.id}.` });
    }
    res.json({ mensaje: "Objetivo eliminado.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el objetivo." });
  }
}
