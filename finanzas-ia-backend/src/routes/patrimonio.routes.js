import { Router } from "express";
import {
  obtenerPatrimonio,
  obtenerEvolucionPatrimonio,
  obtenerEvolucionAhorro
} from "../controllers/patrimonio.controller.js";

const router = Router();

router.get("/", obtenerPatrimonio);
router.get("/evolucion", obtenerEvolucionPatrimonio);
router.get("/evolucion-ahorro", obtenerEvolucionAhorro);

export default router;
