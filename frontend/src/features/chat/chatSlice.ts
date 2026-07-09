import api from "@/api/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ChatState, Message } from "@/types";

const initialState: ChatState = {
  chat: null,
  allChats: null,
  currentChat: null,
  isLoading: false,
  error: null,
  isGenerating: false,
  isDeleting: false,
  isCreating: false,
};

export const createChat = createAsyncThunk(
  "chat/createChat",
  async (userData: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/chats`,
        userData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Create chat failed"
      );
    }
  }
);

export const getAllChats = createAsyncThunk(
  "chat/getAllChats",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      const res = await api.get(`${import.meta.env.VITE_BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Fetch chats failed"
      );
    }
  }
);

export const getChatById = createAsyncThunk(
  "chat/getChatById",
  async (chatId: string, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      const res = await api.get(
        `${import.meta.env.VITE_BASE_URL}/chats/${chatId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Fetch chat failed"
      );
    }
  }
);

export const deleteChatById = createAsyncThunk(
  "chat/deleteChatById",
  async (chatId: string, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      await api.delete(`${import.meta.env.VITE_BASE_URL}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return chatId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Delete chat failed"
      );
    }
  }
);

export const createMessage = createAsyncThunk(
  "chat/createMessage",
  async (messageData: { prompt: string; chatId: string }, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Create message failed"
      );
    }
  }
);

export const createImage = createAsyncThunk(
  "chat/createImage",
  async (imageData: { prompt: string; chatId: string }, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken)
        return rejectWithValue("No authentication accessToken found");

      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/images`,
        imageData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Create image failed"
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    updateChatName: (state, action) => {
      const { chatId, chatName } = action.payload as { chatId: string; chatName: string };

      if (state.currentChat?.data?.id === chatId) {
        state.currentChat.data.name = chatName;
      }

      const index = state.allChats?.data?.findIndex(
        (chat) => chat.id === chatId
      );
      if (index !== undefined && index !== -1 && state.allChats?.data) {
        state.allChats.data[index].name = chatName;
      }
    },

    addChatToAllChats: (state, action) => {
      state.allChats = state.allChats
        ? { ...state.allChats, data: [action.payload, ...state.allChats.data] }
        : { status: true, message: "", data: [action.payload] };
    },

    addTempMessage: (state, action) => {
      if (!state.currentChat?.data?.messages)
        state.currentChat!.data.messages = [];
      state.currentChat!.data.messages.push(action.payload);
    },

    replaceTempMessage: (state, action) => {
      if (!state.currentChat?.data?.messages) return;
      const index = state.currentChat.data.messages.findIndex(
        (msg) => (msg as Message).isTemp === true && msg.role === "assistant"
      );
      if (index !== -1) {
        state.currentChat.data.messages[index] = action.payload;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createChat.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.isCreating = false;
        state.chat = action.payload;
        state.error = null;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })
      .addCase(getAllChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allChats = action.payload;
        state.error = null;
      })
      .addCase(getAllChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getChatById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChatById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChat = action.payload;
        state.error = null;
      })
      .addCase(getChatById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteChatById.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteChatById.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.currentChat = null;
        state.chat = null;
        if (state.allChats?.data) {
          state.allChats.data = state.allChats.data.filter(
            (c) => c.id !== (action.payload as string)
          );
        }
        state.error = null;
      })
      .addCase(deleteChatById.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      .addCase(createMessage.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state) => {
        state.isGenerating = false;
        state.error = null;
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      .addCase(createImage.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(createImage.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (!state.currentChat?.data?.messages)
          state.currentChat!.data.messages = [];
        state.currentChat!.data.messages.push(action.payload);
        state.error = null;
      })
      .addCase(createImage.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateChatName,
  addChatToAllChats,
  addTempMessage,
  replaceTempMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
