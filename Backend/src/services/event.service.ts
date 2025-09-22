import { Event, IEvent } from "../models/event.models";

interface EventResponse {
  message: string;
  event?: IEvent | IEvent[];
}

interface AvailabilityResponse {
  eventId: string;
  eventName: string;
  availability: Array<{
    section: string;
    rows: Array<{
      row: string;
      availableSeats: number;
      totalSeats: number;
      bookedSeats: number;
    }>;
  }>;
}

interface PurchaseResponse {
  message: string;
  section?: string;
  row?: string;
  purchasedQuantity?: number;
  groupDiscount?: boolean;
  remainingSeats?: number;
}

export class EventService {
  static async createEvent(name: string, sections: any): Promise<EventResponse> {
    if (!name || !sections) {
      throw new Error("Name and sections are required");
    }

    const event = await Event.create({ name, sections });

    if (!event) {
      throw new Error("Something went wrong");
    }

    return {
      message: "Event created successfully",
      event,
    };
  }

  static async getAllEvents(): Promise<EventResponse> {
    const events = await Event.find();

    if (!events) {
      throw new Error("Something went wrong");
    }

    return {
      message: "Events retrieved successfully",
      event: events,
    };
  }

  static async getEventAvailability(id: string): Promise<AvailabilityResponse> {
    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    const availability = event.sections.map((section) => ({
      section: section.name,
      rows: section.rows.map((row) => ({
        row: row.name,
        availableSeats: row.totalSeats - row.bookedSeats,
        totalSeats: row.totalSeats,
        bookedSeats: row.bookedSeats,
      })),
    }));

    return {
      eventId: event._id as string,
      eventName: event.name,
      availability,
    };
  }

  static async purchaseTickets(
    id: string,
    sectionName: string,
    rowName: string,
    quantity: number
  ): Promise<PurchaseResponse> {
    if (!sectionName || !rowName || !quantity || quantity <= 0) {
      throw new Error("sectionName, rowName and valid quantity are required");
    }

    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    const section = event.sections.find((s) => s.name === sectionName);
    if (!section) {
      throw new Error("Section not found");
    }

    const row = section.rows.find((r) => r.name === rowName);
    if (!row) {
      throw new Error("Row not found");
    }

    const availableSeats = row.totalSeats - row.bookedSeats;
    if (quantity > availableSeats) {
      throw new Error(`Only ${availableSeats} seats are available`);
    }

    row.bookedSeats += quantity;
    await event.save();

    const remainingSeats = row.totalSeats - row.bookedSeats;
    const groupDiscount = quantity >= 4;

    return {
      message: "Tickets purchased successfully",
      section: sectionName,
      row: rowName,
      purchasedQuantity: quantity,
      groupDiscount,
      remainingSeats,
    };
  }
}