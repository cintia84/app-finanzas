import jwt from "jsonwebtoken";

export function verificarToken(req, res, next) {
  // El token viaja en el header así: "Authorization: Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No se envió un token de autenticación." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // jwt.verify revisa que el token esté firmado con nuestro secreto y
    // que no haya expirado. Si algo no cierra, tira una excepción.
    const datosDelToken = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosDelToken; // lo dejamos disponible para el resto de la ruta
    next(); // todo bien, dejamos pasar el pedido al controller
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o vencido." });
  }
}
