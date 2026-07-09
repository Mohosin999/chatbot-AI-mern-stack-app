export interface Message {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  isTemp?: boolean;
  isTyping?: boolean;
  isImage?: boolean;
  chatName?: string;
}

export interface ChatData {
  id: string;
  name: string;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatState {
  chat: ChatResponse | null;
  allChats: ChatListResponse | null;
  currentChat: ChatResponse | null;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  isDeleting: boolean;
  isCreating: boolean;
}

export interface ChatResponse {
  status: boolean;
  message: string;
  data: ChatData;
}

export interface ChatListResponse {
  status: boolean;
  message: string;
  data: ChatData[];
}

export interface CreateMessagePayload {
  prompt: string;
  chatId: string;
}

export interface CreateImagePayload {
  prompt: string;
  chatId: string;
}
