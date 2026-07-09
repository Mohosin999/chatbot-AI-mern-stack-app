import React from "react";
import ChatItem from "./ChatItem";
import type { ChatData, ChatResponse } from "@/types";

interface ChatListProps {
  token: string;
  chats: ChatData[] | undefined;
  currentChat: ChatResponse | null;
  onSelectChat: (chatId: string) => void;
  chatToDelete: ChatData | null;
  setChatToDelete: (chat: ChatData) => void;
  alertOpen: boolean;
  setAlertOpen: (open: boolean) => void;
  onConfirmDelete: (chatId: string) => void;
}

const ChatList = ({
  token,
  chats,
  currentChat,
  onSelectChat,
  chatToDelete,
  setChatToDelete,
  alertOpen,
  setAlertOpen,
  onConfirmDelete,
}: ChatListProps) => {
  if (!token)
    return (
      <p className="text-gray-400 text-center mt-4 h-full">
        Login to see your chats.
      </p>
    );

  if (chats?.length === 0)
    return (
      <p className="text-gray-400 text-center mt-4 h-full">No chats found.</p>
    );

  return (
    <div className="flex-1 overflow-y-auto my-5 space-y-2 no-scrollbar scroll-smooth">
      <ul>
        {chats?.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={currentChat?.data?.id === chat.id}
            onSelectChat={onSelectChat}
            setChatToDelete={setChatToDelete}
            onConfirmDelete={onConfirmDelete}
          />
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
