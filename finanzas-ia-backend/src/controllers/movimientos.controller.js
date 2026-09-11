import Movimiento from "../models/Movimiento.js";

export async function obtenerMovimientos(req, res) {
  const movimientos = await Movimiento.find().select("-_id -__v");
  res.json(movimientos);
}

// Ya no hay validación acá adentro: si llegamos hasta este punto,
// es porque express-validator (en la ruta) ya revisó que todo esté bien.
export async function crearMovimiento(req, res) {
  try {
    const cantidad = await Movimiento.countDocuments();
    const nuevoId = `M${String(cantidad + 1).padStart(5, "0")}`;

    const nuevoMovimiento = await Movimiento.create({
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
      { id: req.params.id },
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
    ).select("-_id -__v");

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
    const movimiento = await Movimiento.findOneAndDelete({ id: req.params.id });
    if (!movimiento) {
      return res.status(404).json({ error: `No existe un movimiento con id ${req.params.id}.` });
    }
    res.json({ mensaje: "Movimiento eliminado.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar el movimiento." });
  }
}
