import Cuenta from "../models/Cuenta.js";

export async function obtenerCuentas(req, res) {
  const cuentas = await Cuenta.find({ usuarioId: req.usuario.id }).select("-_id -__v -usuarioId");
  res.json(cuentas);
}

export async function crearCuenta(req, res) {
  const { nombre, banco, titular, saldo } = req.body;
  const cantidad = await Cuenta.countDocuments({ usuarioId: req.usuario.id });
  const id = req.body.id || `C${String(cantidad + 1).padStart(3, "0")}`;

  try {
    const nuevaCuenta = await Cuenta.create({
      usuarioId: req.usuario.id, id, nombre, banco, titular, saldo: Number(saldo)
    });
    res.status(201).json(nuevaCuenta);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: `Ya existe una cuenta con id ${id}.` });
    }
    res.status(500).json({ error: "No se pudo guardar la cuenta." });
  }
}

export async function actualizarCuenta(req, res) {
  const { nombre, banco, titular, saldo } = req.body;

  try {
    const cuenta = await Cuenta.findOneAndUpdate(
      { id: req.params.id, usuarioId: req.usuario.id },
      { nombre, banco, titular, saldo: Number(saldo) },
      { new: true }
    ).select("-_id -__v -usuarioId");

    if (!cuenta) {
      return res.status(404).json({ error: `No existe una cuenta con id ${req.params.id}.` });
    }
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar la cuenta." });
  }
}

export async function eliminarCuenta(req, res) {
  try {
    const cuenta = await Cuenta.findOneAndDelete({ id: req.params.id, usuarioId: req.usuario.id });
    if (!cuenta) {
      return res.status(404).json({ error: `No existe una cuenta con id ${req.params.id}.` });
    }
    res.json({ mensaje: "Cuenta eliminada.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar la cuenta." });
  }
}
