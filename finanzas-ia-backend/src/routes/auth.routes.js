import { Router } from "express";
import { registrar, iniciarSesion } from "../controllers/auth.controller.js";
import { reglasRegistro, reglasLogin } from "../validators/auth.validator.js";
import { manejarErroresValidacion } from "../middlewares/validacion.middleware.js";

const router = Router();

router.post("/registro", reglasRegistro, manejarErroresValidacion, registrar);
router.post("/login", reglasLogin, manejarErroresValidacion, iniciarSesion);

export default router;
