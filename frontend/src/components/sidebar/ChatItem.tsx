import React, { useState, useRef, useEffect, useCallback } from "react";
import { BsThreeDots } from "react-icons/bs";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAppSelector } from "@/hooks/useAppStore";
import { useDispatch } from "react-redux";
import { renameChatById } from "@/features/chat/chatSlice";
import Loader from "../Loader";
import type { ChatData } from "@/types";
import { ConfirmDialog } from "../ConfirmDialog";

interface ChatItemProps {
  chat: ChatData;
  isSelected: boolean;
  onSelectChat: (chatId: string) => void;
  setChatToDelete: (chat: ChatData) => void;
  onConfirmDelete: (chatId: string) => void;
}

const ChatItem = ({
  chat,
  isSelected,
  onSelectChat,
  setChatToDelete,
  onConfirmDelete,
}: ChatItemProps) => {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [alertOpen, setAlertOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDeleting } = useAppSelector((state) => state.chat);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.left - 40 });
    setMenuOpen((prev) => !prev);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right - 160 });
    setMenuOpen(true);
  }, []);

  const saveRename = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === chat.name) {
      setEditing(false);
      setEditValue(chat.name);
      return;
    }
    await dispatch(renameChatById({ chatId: chat.id, name: trimmed }) as any);
    setEditing(false);
  };

  return (
    <li
      onClick={() => onSelectChat(chat.id)}
      onContextMenu={handleContextMenu}
      className={`group text-sm flex items-center justify-between p-1 px-3 rounded-lg cursor-pointer transition select-none ${
        isSelected
          ? "bg-gray-200 dark:bg-[#303841]"
          : "hover:bg-gray-100 dark:hover:bg-[#303841]"
      }`}
    >
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Loader title={"Deleting chat..."} />
        </div>
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveRename(editValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveRename(editValue);
            if (e.key === "Escape") {
              setEditValue(chat.name);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 truncate bg-transparent text-sm text-gray-900 dark:text-white outline-none"
        />
      ) : (
        <span className="flex-1 truncate text-gray-900 dark:text-white">
          {chat.name}
        </span>
      )}

      {!editing && (
        <span
          ref={btnRef}
          onClick={openMenu}
          className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-105 transition cursor-pointer inline-flex ${
            isSelected ? "visible" : "invisible group-hover:visible"
          }`}
        >
          <BsThreeDots className="text-gray-500 dark:text-gray-400" />
        </span>
      )}

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
          }}
          className="w-36 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditValue(chat.name);
              setEditing(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
          >
            <Pencil size={14} /> Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setChatToDelete(chat);
              setAlertOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <ConfirmDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title="Delete Chat"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => onConfirmDelete(chat.id)}
        variant="destructive"
      />
    </li>
  );
};

export default ChatItem;
