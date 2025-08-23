import { Schema, model } from "mongoose";

const CounterSchema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  sequence: { type: Number, default: 0 },
});

export const CounterModel = model("Counter", CounterSchema);
