import Movimiento from "../models/Movimiento.js";

export async function obtenerMovimientos(req, res) {
  const movimientos = await Movimiento.find({ usuarioId: req.usuario.id }).select("-_id -__v -usuarioId");
  res.json(movimientos);
}

export async function crearMovimiento(req, res) {
  try {
    const cantidad = await Movimiento.countDocuments({ usuarioId: req.usuario.id });
    const nuevoId = `M${String(cantidad + 1).padStart(5, "0")}`;

    const nuevoMovimiento = await Movimiento.create({
      usuarioId: req.usuario.id,
      id: nuevoId,
      fecha: req.body.fecha,
      comercio: req.body.comercio,
      categoria: req.body.categoria,
      subcategoria: req.body.subcategoria || null,
      cuenta: req.body.cuenta,
      medio: req.body.medio || null,
      importe: Number(req.body.importe)
    });

    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el movimiento." });
  }
}

export async function actualizarMovimiento(req, res) {
  try {
    const movimiento = await Movimiento.findOneAndUpdate(
      { id: req.params.id, usuarioId: req.usuario.id },
      {
        fecha: req.body.fecha,
        comercio: req.body.comercio,
        categoria: req.body.categoria,
        subcategoria: req.body.subcategoria || null,
        cuenta: req.body.cuenta,
        medio: req.body.medio || null,
        importe: Number(req.body.importe)
      },
      { new: true }
    ).select("-_id -__v -usuarioId");

    if (!movimiento) {
      return res.status(404).json({ error: `No existe un movimiento con id ${req.params.id}.` });
    }
    res.json(movimiento);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el movimiento." });
  }
}

export async function eliminarMovimiento(req, res) {
  try {
    const movimiento = await Movimiento.findOneAndDelete({ id: req.params.id, usuarioId: req.usuario.id });
    if (!movimiento) {
      return res.status(404).json({ error: `No existe un movimiento con id ${req.params.id}.` });
    }
    res.json({ mensaje: "Movimiento eliminado.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el movimiento." });
  }
}
