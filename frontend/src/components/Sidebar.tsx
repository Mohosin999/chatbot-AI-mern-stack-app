import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/features/auth/authSlice";
import {
  clearCurrentChat,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onSearchOpen?: () => void;
}

const Sidebar = ({ handleSidebarClose, collapsed = false, onToggleCollapse, onClose, onSearchOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allChats, currentChat } = useAppSelector((state) => state.chat);
  const token = localStorage.getItem("accessToken") || "";

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

  const handleCreateChat = () => {
    if (!token) return navigate("/login");
    if (handleSidebarClose) handleSidebarClose();
    dispatch(clearCurrentChat());
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

  const allChatsData = allChats?.data || [];

  return (
    <div className="flex flex-col h-full px-3 xl:px-4 bg-[#F9FAFB] dark:bg-[#181818] text-gray-900 dark:text-white">
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse || (() => {})}
        onSearchClick={() => onSearchOpen?.()}
        onCreateChat={handleCreateChat}
        onClose={onClose}
      />

      <ChatList
        token={token}
        chats={allChatsData}
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
