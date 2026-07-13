import { Schema, model, Document } from "mongoose";

export interface IMessageDocument {
  _id?: { toString(): string } | string;
  id?: string;
  role: string;
  content: string;
  timestamp: number;
  isImage?: boolean;
  isPublished?: boolean;
}

export interface IChatDocument extends Document {
  userId: string;
  userName: string;
  name: string;
  messages: IMessageDocument[];
  summary?: string;
  summaryUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChatDocument>(
  {
    userId: { type: String, ref: "User", required: true },
    userName: { type: String, required: true },
    name: { type: String, default: "New Chat" },
    messages: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, required: true },
      },
    ],
    summary: { type: String },
    summaryUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

const Chat = model<IChatDocument>("Chat", chatSchema);

export default Chat;
