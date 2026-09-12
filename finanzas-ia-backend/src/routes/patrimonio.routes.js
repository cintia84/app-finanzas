import { Router } from "express";
import {
  obtenerPatrimonio,
  obtenerEvolucionPatrimonio,
  obtenerEvolucionAhorro,
  controladorActivos,
  controladorPasivos,
  controladorInversiones,
  controladorCreditos
} from "../controllers/patrimonio.controller.js";

const router = Router();

router.get("/", obtenerPatrimonio);
router.get("/evolucion", obtenerEvolucionPatrimonio);
router.get("/evolucion-ahorro", obtenerEvolucionAhorro);

router.post("/activos", controladorActivos.agregar);
router.put("/activos/:id", controladorActivos.actualizar);
router.delete("/activos/:id", controladorActivos.eliminar);

router.post("/pasivos", controladorPasivos.agregar);
router.put("/pasivos/:id", controladorPasivos.actualizar);
router.delete("/pasivos/:id", controladorPasivos.eliminar);

router.post("/inversiones", controladorInversiones.agregar);
router.put("/inversiones/:id", controladorInversiones.actualizar);
router.delete("/inversiones/:id", controladorInversiones.eliminar);

router.post("/creditos", controladorCreditos.agregar);
router.put("/creditos/:id", controladorCreditos.actualizar);
router.delete("/creditos/:id", controladorCreditos.eliminar);

export default router;
