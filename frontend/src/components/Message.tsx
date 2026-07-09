import React, { useEffect } from "react";
import Markdown from "react-markdown";
import Prism from "prismjs";
import TypingIndicator from "./ui/typing-indicator";
import type { Message as MessageType } from "@/types";

interface MessageProps {
  msg: MessageType;
}

const Message = ({ msg }: MessageProps) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [msg.content]);

  if (msg.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="p-3 rounded-lg rounded-bl-none">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        msg.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`rounded-lg lg:max-w-[90%] ${
          msg.role === "user"
            ? "bg-gray-300 dark:bg-[#303030] text-gray-900 dark:text-gray-200 rounded-br-none px-3"
            : "p-3"
        }`}
      >
        <div className="text-base reset-tw">
          {msg.isTemp ? (
            <span className="italic text-gray-400 animate-pulse">
              {msg.content}
            </span>
          ) : (
            <Markdown>{msg.content}</Markdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
