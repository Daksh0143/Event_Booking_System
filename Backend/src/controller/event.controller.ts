import { Request, Response } from "express";
import { EventService } from "../services/event.service";

export class EventController {
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const { name, sections } = req.body;
      const result = await EventService.createEvent(name, sections);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("ERROR", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  static async getAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const result = await EventService.getAllEvents();
      res.status(200).json(result);
    } catch (error: any) {
      console.error("ERROR", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  static async getEventAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await EventService.getEventAvailability(id);
      res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(error.message === "Event not found" ? 404 : 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  static async purchaseTickets(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sectionName, rowName, quantity } = req.body;
      const result = await EventService.purchaseTickets(id, sectionName, rowName, quantity);
      res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(
        error.message.includes("not found")
          ? 404
          : error.message.includes("are required") || error.message.includes("seats are available")
          ? 400
          : 500
      ).json({
        message: error.message || "Internal server error",
      });
    }
  }
}