import React, { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useAppSelector } from "@/hooks/useAppStore";
import Loader from "../Loader";
import type { ChatData } from "@/types";

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
  const [alertOpen, setAlertOpen] = useState(false);
  const { isDeleting } = useAppSelector((state) => state.chat);

  return (
    <li
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none active:scale-105 ${
        isSelected ? "bg-[#303841]" : "hover:bg-[#303841]"
      }`}
    >
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Loader title={"Deleting chat..."} />
        </div>
      )}

      <span className="flex-1" onClick={() => onSelectChat(chat.id)}>
        {chat.name}
      </span>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogTrigger asChild>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setChatToDelete(chat);
              setAlertOpen(true);
            }}
            className="p-1 rounded-full hover:bg-gray-600 active:scale-105 transition cursor-pointer"
          >
            <BsThreeDots />
          </span>
        </AlertDialogTrigger>

        <AlertDialogContent className="w-96 !p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium">
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm lg:text-base text-gray-700 dark:text-gray-400 mt-1">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel className="px-3 py-1 rounded border text-sm cursor-pointer select-none active:scale-105">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirmDelete(chat.id);
                setAlertOpen(false);
              }}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm cursor-pointer select-none active:scale-105"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
};

export default ChatItem;
