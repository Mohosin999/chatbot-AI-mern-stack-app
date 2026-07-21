import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import ContentArea from "@/components/ContentArea";
import { FiMenu } from "react-icons/fi";
import { Search, X, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { getChatById } from "@/features/chat/chatSlice";
import { useAppSelector } from "@/hooks/useAppStore";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allChats, currentChat } = useAppSelector((state) => state.chat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const chatName = currentChat?.data?.name;
    document.title = chatName ? `ChatBOT - ${chatName}` : "ChatBOT";
  }, [currentChat]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleSearchResultClick = (chatId: string) => {
    dispatch(getChatById(chatId) as any);
    setSearchOpen(false);
    setSearchQuery("");
    setIsSidebarOpen(false);
  };

  const allChatsData = allChats?.data || [];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allChatsData.filter((chat) =>
      chat.name.toLowerCase().includes(q)
    );
  }, [searchQuery, allChatsData]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#212121] border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-transparent text-gray-950 dark:text-white hover:bg-transparent shadow-none hover:text-orange-800 active:border-2 border-gray-900"
          >
            <FiMenu size={24} />
          </Button>

          <div className="flex items-center justify-center mx-auto">
            <h2 className="text-xl font-semibold ml-2">Chatbot</h2>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside
          className="hidden lg:block bg-[#F9FAFB] dark:bg-[#181818] h-screen overflow-hidden flex-shrink-0 transition-[width] duration-500 ease-in-out border-r border-gray-300 dark:border-gray-700"
          style={{ width: collapsed ? 0 : 300 }}
        >
          <div className="min-w-[260px] h-full">
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(!collapsed)}
              onSearchOpen={() => setSearchOpen(true)}
            />
          </div>
        </aside>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex absolute top-3 left-3 z-30 items-center justify-center w-9 h-9 rounded-lg bg-[#F9FAFB] dark:bg-[#181818] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        <div
          className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          <div
            className={`absolute top-0 left-0 w-80 h-full bg-[#181818] text-white shadow-lg flex flex-col transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar handleSidebarClose={handleSidebarClose} onClose={handleSidebarClose} onSearchOpen={() => setSearchOpen(true)} />
          </div>
        </div>

        <main className="flex-1 min-w-0 transition-[margin] duration-500 ease-in-out"
          style={{ marginLeft: collapsed ? 0 : undefined }}
        >
          <ContentArea />
        </main>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[300] max-lg:bg-white max-lg:dark:bg-[#1e1e1e] lg:bg-black/60 lg:flex lg:items-center lg:justify-center"
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
        >
          <div
            className="flex flex-col max-lg:h-full max-lg:w-full lg:max-h-[70vh] lg:w-[480px] lg:max-w-[90vw] lg:bg-white lg:dark:bg-[#1e1e1e] lg:rounded-xl lg:shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search chats by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {searchQuery.trim() ? "No chats match your search." : "No chats yet."}
                </p>
              ) : (
                searchResults.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSearchResultClick(chat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${
                      currentChat?.data?.id === chat.id
                        ? "bg-[#48A4FF]/10 text-[#48A4FF]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303841]"
                    }`}
                  >
                    {chat.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
