import Cuenta from "../models/Cuenta.js";

export async function obtenerCuentas(req, res) {
  const cuentas = await Cuenta.find().select("-_id -__v");
  res.json(cuentas);
}

export async function crearCuenta(req, res) {
  const { nombre, banco, titular, saldo } = req.body;
  const id = req.body.id || `C${String(await Cuenta.countDocuments() + 1).padStart(3, "0")}`;

  try {
    const nuevaCuenta = await Cuenta.create({ id, nombre, banco, titular, saldo: Number(saldo) });
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
      { id: req.params.id },
      { nombre, banco, titular, saldo: Number(saldo) },
      { new: true }
    ).select("-_id -__v");

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
    const cuenta = await Cuenta.findOneAndDelete({ id: req.params.id });
    if (!cuenta) {
      return res.status(404).json({ error: `No existe una cuenta con id ${req.params.id}.` });
    }
    res.json({ mensaje: "Cuenta eliminada.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "No se pudo eliminar la cuenta." });
  }
}
