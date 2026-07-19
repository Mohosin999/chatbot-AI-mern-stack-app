import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FaPlus } from "react-icons/fa6";

interface SidebarHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onCreateChat: () => void;
}

const SidebarHeader = ({
  searchTerm,
  setSearchTerm,
  onCreateChat,
}: SidebarHeaderProps) => {
  return (
    <div>
      <div className="flex items-center justify-center my-6">
        <img src="./vite.png" alt="App Logo" className="w-14 h-14" />
        <h2 className="text-2xl font-semibold">ORTEX</h2>
      </div>

      <Button
        variant="outline"
        onClick={onCreateChat}
        className="w-full mb-3 text-gray-900 dark:bg-gray-100 active:scale-102 cursor-pointer"
      >
        <FaPlus className="mr-1" /> Add New Chat
      </Button>

      <Input
        type="text"
        placeholder="Search chats..."
        className="text-white placeholder:text-gray-300 selection:bg-orange-400 outline-none border-gray-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default SidebarHeader;
