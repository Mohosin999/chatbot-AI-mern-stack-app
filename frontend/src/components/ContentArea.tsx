import React, { useRef, useEffect } from "react";
import ChatInput, { type ChatInputHandle } from "./ui/ChatInput";
import { useDispatch } from "react-redux";
import Message from "./Message";
import {
  createChat,
  createMessage,
  getChatById,
  updateChatName,
  addChatToAllChats,
  addTempMessage,
  replaceTempMessage,
} from "@/features/chat/chatSlice";
import { useAppSelector } from "@/hooks/useAppStore";

const ContentArea = () => {
  const { currentChat, isGenerating } = useAppSelector((state) => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const dispatch = useDispatch();

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!chatContainerRef.current) return;

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const images = chatContainerRef.current.querySelectorAll("img");
    if (images.length === 0) {
      scrollToBottom();
      return;
    }

    let loadedCount = 0;
    images.forEach((img) => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.addEventListener("load", () => {
          loadedCount++;
          if (loadedCount === images.length) scrollToBottom();
        });
        img.addEventListener("error", () => {
          loadedCount++;
          if (loadedCount === images.length) scrollToBottom();
        });
      }
    });

    if (loadedCount === images.length) scrollToBottom();
  }, [currentChat?.data?.messages]);

  useEffect(() => {
    if (!accessToken) return;
    if (currentChat?.data?.messages.length === 0) {
      chatInputRef.current?.focus();
    }
  }, [accessToken, currentChat?.data?.messages, isGenerating]);

  const handleSend = async (text: string) => {
    if (!accessToken || !text.trim()) return;

    const existingChatId = currentChat?.data?.id;
    let currentChatId = existingChatId;

    if (!currentChatId) {
      const res = await dispatch(createChat({}) as any);

      if (res.meta.requestStatus !== "fulfilled") return;

      currentChatId = res.payload.data.id as string;
      dispatch(addChatToAllChats(res.payload.data));

      await dispatch(getChatById(currentChatId) as any);
    }

    dispatch(
      addTempMessage({
        id: Date.now(),
        role: "user",
        content: text,
      })
    );

    dispatch(
      addTempMessage({
        id: "typing-indicator",
        role: "assistant",
        isTyping: true,
        isTemp: true,
      })
    );

    const messageRes = await dispatch(
      createMessage({ prompt: text.trim(), chatId: currentChatId! }) as any
    );

    if (messageRes.meta.requestStatus === "fulfilled") {
      const finalMessage = messageRes.payload.data;

      dispatch(
        replaceTempMessage({
          ...finalMessage,
          isTyping: false,
        })
      );

      if (finalMessage.chatName) {
        dispatch(
          updateChatName({
            chatId: currentChatId,
            chatName: finalMessage.chatName,
          })
        );
      }
    }

    chatInputRef.current?.focus();
  };

  return (
    <div className="h-screen bg-[#f5ebeb] dark:bg-[#212121] pb-6 pt-16 lg:pt-6 flex flex-col relative">
      <div
        className="flex-1 flex flex-col overflow-y-auto"
        ref={chatContainerRef}
      >
        <div className="px-4 xl:pr-1 relative flex-1">
          {(() => {
            const messages = currentChat?.data?.messages;
            const hasMessages = messages && messages.length > 0;

            if (!accessToken) {
              return (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src="./vite.png" alt="Logo" className="w-30 h-30 mb-4" />
                  <h2 className="text-3xl md:text-5xl px-4 md:px-0 font-semibold text-gray-800 dark:text-gray-100 mb-10">
                    What's on your <span className="text-[#48A4FF]">mind?</span>
                  </h2>
                </div>
              );
            }

            if (hasMessages) {
              return (
                <div className="flex flex-col space-y-2 w-full md:max-w-2xl xl:max-w-3xl mx-auto mt-4">
                  {messages!.map((msg) => (
                    <Message key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              );
            }

            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <img src="./vite.png" alt="Logo" className="w-30 h-30 mb-4" />
                <h2 className="text-3xl md:text-5xl px-4 md:px-0 font-semibold text-gray-800 dark:text-gray-100 mb-10">
                  What's on your <span className="text-[#48A4FF]">mind?</span>
                </h2>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="w-full md:max-w-2xl xl:max-w-3xl mx-auto">
        <ChatInput ref={chatInputRef} onSend={handleSend} />
      </div>
    </div>
  );
};

export default React.memo(ContentArea);
