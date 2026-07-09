export interface IMessage {
  _id?: { toString(): string } | string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isImage?: boolean;
  isPublished?: boolean;
  chatName?: string;
}

export interface IChat {
  _id: string;
  id: string;
  userId: string;
  userName: string;
  name: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatDoc {
  _doc: IChat;
  id: string;
  userId: string;
  userName: string;
  name: string;
  messages: IMessage[];
}
