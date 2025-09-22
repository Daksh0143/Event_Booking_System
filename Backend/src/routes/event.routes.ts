import { Router } from "express";
import { EventController } from "../controller/event.controller";

const router: Router = Router();

router.post("/events", EventController.createEvent);
router.get("/events", EventController.getAllEvents);
router.get("/events/:id/availability", EventController.getEventAvailability);
router.post("/events/:id/purchase", EventController.purchaseTickets);

export default router;