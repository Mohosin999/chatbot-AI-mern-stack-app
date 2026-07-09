import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "@/features/auth/authSlice";
import {
  createChat,
  deleteChatById,
  getAllChats,
  getChatById,
  updateChatName,
  addChatToAllChats,
} from "@/features/chat/chatSlice";
import ChatList from "./sidebar/ChatList";
import SidebarFooter from "./sidebar/SidebarFooter";
import SidebarHeader from "./sidebar/SidebarHeader";
import toast from "react-hot-toast";

/**
 * Sidebar Component
 * -----------------
 * Provides a full-featured chat sidebar that allows users to:
 * - View all chats with search functionality
 * - Create new chats and automatically generate titles based on the first message
 * - Select a chat to view its messages
 * - Delete chats with confirmation
 * - Logout or navigate to login
 *
 * Features:
 * 1. Uses Redux for global chat and auth state management.
 * 2. Optimizes chat title synchronization using a batched useEffect that:
 *    - Fetches all chats from the server
 *    - Checks if the chat has a proper name
 *    - If not, derives a title from the first message and updates it in batch
 * 3. Handles chat creation by:
 *    - Creating a new chat
 *    - Fetching the new chat details
 *    - Updating Redux state
 *    - Persisting the chat title to the server
 * 4. Handles chat deletion and updates the currently active chat accordingly
 *
 * Props:
 * @param {function} handleSidebarClose - Optional function to close the sidebar (used in mobile/responsive view)
 *
 * Example Usage:
 * <Sidebar handleSidebarClose={closeSidebarFunction} />
 */
const Sidebar = ({ handleSidebarClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allChats, currentChat } = useSelector((state) => state.chat);
  const token = localStorage.getItem("accessToken") || "";

  // Local states
  const [searchTerm, setSearchTerm] = useState(""); // Filter chats by name
  const [chatToDelete, setChatToDelete] = useState(null); // Stores the chat pending deletion
  const [alertOpen, setAlertOpen] = useState(false); // Controls delete confirmation modal

  /**
   * useEffect - Synchronize chat titles
   * ------------------------------------
   * This effect fetches all chats on mount and checks if they have valid names.
   * If a chat has a missing or default name, it derives a title from the first
   * message of the chat and updates it both in Redux and the server.
   */
  useEffect(() => {
    if (!token) return;

    const syncChatTitles = async () => {
      const res = await dispatch(getAllChats());
      if (res?.meta?.requestStatus !== "fulfilled") return;

      const chats = res.payload?.data || [];

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
      const validResults = results.filter(Boolean);

      validResults.forEach(({ chatId, title }) => {
        dispatch(updateChatName({ chatId, chatName: title }));
      });
    };

    syncChatTitles();
  }, [dispatch, token]);

  /**
   * Create a new chat and synchronize its title
   */
  const handleCreateChat = async () => {
    if (!token) return navigate("/login");
    if (handleSidebarClose) handleSidebarClose();

    const res = await dispatch(createChat({}));

    if (res.meta.requestStatus === "fulfilled") {
      const chatData = res.payload.data;
      await dispatch(getChatById(chatData.id));
      dispatch(addChatToAllChats(chatData));
    }
  };

  /**
   * Fetch a chat by ID and select it
   * @param {string} chatId - ID of the chat to fetch
   */
  const handleGetChatById = (chatId) => {
    if (!token) return navigate("/login");
    dispatch(getChatById(chatId));
    if (handleSidebarClose) handleSidebarClose();
  };

  /**
   * Confirm and delete a selected chat
   */
  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete.id;
    setAlertOpen(false);
    setChatToDelete(null);

    const res = await dispatch(deleteChatById(chatId));

    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Chat deleted");
    }
  };

  /**
   * Logout the current user
   */
  const handleLogout = () => {
    dispatch(logoutUser());
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

// PropTypes for runtime type checking
Sidebar.propTypes = {
  handleSidebarClose: PropTypes.func, // Optional function to close sidebar
};

export default React.memo(Sidebar);
