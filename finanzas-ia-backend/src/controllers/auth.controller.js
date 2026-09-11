import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export async function registrar(req, res) {
  const { usuario, password } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({ usuario, passwordHash });
    res.status(201).json({ mensaje: "Usuario creado.", usuario: nuevoUsuario.usuario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: `El usuario "${usuario}" ya existe.` });
    }
    res.status(500).json({ error: "No se pudo crear el usuario." });
  }
}

export async function iniciarSesion(req, res) {
  const { usuario, password } = req.body;

  const usuarioEncontrado = await Usuario.findOne({ usuario });

  // Mismo mensaje de error tanto si el usuario no existe como si la
  // contraseña está mal, para no revelar qué usuarios existen
  if (!usuarioEncontrado) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.passwordHash);
  if (!passwordCorrecta) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const token = jwt.sign(
    { id: usuarioEncontrado._id, usuario: usuarioEncontrado.usuario },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, usuario: usuarioEncontrado.usuario });
}
