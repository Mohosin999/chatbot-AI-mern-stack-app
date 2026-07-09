import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { FaCircleArrowRight } from "react-icons/fa6";

export interface ChatInputHandle {
  focus: () => void;
}

interface ChatInputProps {
  onSend: (text: string) => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ onSend }, ref) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem("accessToken") || "";

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const sendMessage = () => {
    const text = value.trim();
    if (!text) return;
    if (typeof onSend === "function") onSend(text);

    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  return (
    <div className="w-full px-4 md:px-0 flex flex-col items-center">
      <div className="relative w-full rounded-xl border border-gray-300 bg-white dark:bg-[#303030] dark:border-[#303030] shadow-md group">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onInput={adjustHeight}
          onKeyDown={handleKeyDown}
          placeholder="Ask without limits..."
          rows={1}
          disabled={!token}
          className={`w-full resize-none overflow-hidden rounded-xl bg-transparent px-4 py-3 pr-14 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 transition-all duration-150 max-h-60 ${
            !token ? "cursor-not-allowed opacity-50 select-none" : ""
          }`}
        />

        {!token && (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            <div className="rounded-lg bg-gray-800 px-3 py-1 text-sm text-white shadow-lg animate-fade-up">
              You need to login first
            </div>
          </div>
        )}

        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {value.trim().length > 0 && token ? (
            <FaCircleArrowRight
              onClick={sendMessage}
              className="h-7 w-7 cursor-pointer active:scale-105 transition-transform duration-150 text-gray-900 dark:text-gray-100 hover:text-gray-800 hover:dark:text-gray-300"
            />
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
