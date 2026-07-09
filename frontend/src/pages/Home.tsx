import React, { useState } from "react";
import ContentArea from "@/components/ContentArea";
import { FiMenu, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

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
            <h2 className="text-2xl font-bold ml-2">Chatbot</h2>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-1/4 bg-[#181818] h-screen">
          <Sidebar />
        </aside>

        <div
          className={`lg:hidden fixed inset-0 z-50 flex transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          <div className="relative w-64 bg-[#181818] text-white h-full shadow-lg flex flex-col">
            <button
              className="absolute top-3 right-3 text-white hover:text-red-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX size={20} />
            </button>

            <Sidebar handleSidebarClose={handleSidebarClose} />
          </div>
        </div>

        <main className="flex-1 lg:w-3/4">
          <ContentArea />
        </main>
      </div>
    </div>
  );
};

export default Home;
