import { Schema, model, Document } from "mongoose";

export interface IRow {
  name: string;
  totalSeats: number;
  bookedSeats: number;
}

export interface ISection {
  name: string;
  rows: IRow[];
}

export interface IEvent extends Document {
  name: string;
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const rowSchema = new Schema<IRow>(
  {
    name: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, default: 0 },
  },
  { _id: false }
);

const sectionSchema = new Schema<ISection>(
  {
    name: { type: String, required: true },
    rows: [rowSchema],
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    sections: [sectionSchema],
  },
  { timestamps: true }
);

export const Event = model<IEvent>("Event", eventSchema);