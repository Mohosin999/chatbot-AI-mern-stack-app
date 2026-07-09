import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/features/auth/authSlice";
import {
  createChat,
  deleteChatById,
  getAllChats,
  getChatById,
  updateChatName,
  addChatToAllChats,
} from "@/features/chat/chatSlice";
import { useAppSelector } from "@/hooks/useAppStore";
import ChatList from "./sidebar/ChatList";
import SidebarFooter from "./sidebar/SidebarFooter";
import SidebarHeader from "./sidebar/SidebarHeader";
import toast from "react-hot-toast";
import type { ChatData } from "@/types";

interface SidebarProps {
  handleSidebarClose?: () => void;
}

const Sidebar = ({ handleSidebarClose }: SidebarProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allChats, currentChat } = useAppSelector((state) => state.chat);
  const token = localStorage.getItem("accessToken") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [chatToDelete, setChatToDelete] = useState<ChatData | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    const syncChatTitles = async () => {
      const res = await dispatch(getAllChats() as any);
      if (res?.meta?.requestStatus !== "fulfilled") return;

      const chats: ChatData[] = res.payload?.data || [];

      const syncPromises = chats.map(async (chat) => {
        const name = chat?.name ?? "";
        const needsName =
          !name ||
          name.trim() === "" ||
          name.toLowerCase().includes("new chat") ||
          name.toLowerCase().includes("untitled");

        if (!needsName) return;

        try {
          const chatDetailRes = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/chats/${chat.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const fullChat =
            chatDetailRes?.data?.data || chatDetailRes?.data || {};
          const firstMsg = fullChat?.messages?.[0]?.content || "";
          const derivedTitle =
            firstMsg.split(" ").slice(0, 4).join(" ") || "Untitled Chat";

          return { chatId: chat.id, title: derivedTitle };
        } catch (err) {
          console.error("Error syncing chat title:", err);
          return null;
        }
      });

      const results = await Promise.all(syncPromises);
      const validResults = results.filter(Boolean) as { chatId: string; title: string }[];

      validResults.forEach(({ chatId, title }) => {
        dispatch(updateChatName({ chatId, chatName: title }));
      });
    };

    syncChatTitles();
  }, [dispatch, token]);

  const handleCreateChat = async () => {
    if (!token) return navigate("/login");
    if (handleSidebarClose) handleSidebarClose();

    const res = await dispatch(createChat({}) as any);

    if (res.meta.requestStatus === "fulfilled") {
      const chatData = res.payload.data;
      await dispatch(getChatById(chatData.id) as any);
      dispatch(addChatToAllChats(chatData));
    }
  };

  const handleGetChatById = (chatId: string) => {
    if (!token) return navigate("/login");
    dispatch(getChatById(chatId) as any);
    if (handleSidebarClose) handleSidebarClose();
  };

  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete.id;
    setAlertOpen(false);
    setChatToDelete(null);

    const res = await dispatch(deleteChatById(chatId) as any);

    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Chat deleted");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser() as any);
    navigate("/loading");
  };

  const filteredChats = allChats?.data?.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen px-3 xl:px-4 bg-[#181818] text-white">
      <SidebarHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateChat={handleCreateChat}
      />

      <ChatList
        token={token}
        chats={filteredChats}
        currentChat={currentChat}
        onSelectChat={handleGetChatById}
        chatToDelete={chatToDelete}
        setChatToDelete={setChatToDelete}
        alertOpen={alertOpen}
        setAlertOpen={setAlertOpen}
        onConfirmDelete={handleConfirmDeleteChat}
      />
      <SidebarFooter
        token={token}
        onLogout={handleLogout}
        onLogin={() => navigate("/login")}
      />
    </div>
  );
};

export default React.memo(Sidebar);
