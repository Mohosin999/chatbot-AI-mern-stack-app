import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMe } from "@/features/user/userSlice";
import { useAppSelector } from "@/hooks/useAppStore";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import SettingsPopup from "@/components/SettingsPopup";
import { IoMdLogIn } from "react-icons/io";
import { Crown, LogOut, Settings, Palette, User } from "lucide-react";
import { ConfirmDialog } from "../ConfirmDialog";

interface SidebarFooterProps {
  token: string;
  onLogout: () => void;
  onLogin: () => void;
}

const SidebarFooter = ({ token, onLogout, onLogin }: SidebarFooterProps) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [settingsPopupOpen, setSettingsPopupOpen] = useState(false);
  const [settingsPopupTab, setSettingsPopupTab] = useState<
    "general" | "personalization" | "profile" | "data-control"
  >("general");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { profile, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (token && !profile) {
      dispatch(fetchMe() as any);
    }
  }, [token, profile, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#settings" || hash.startsWith("#settings/")) {
      const tab = hash.split("/")[1] as
        | "general"
        | "profile"
        | "personalization"
        | "data-control";
      if (
        ["general", "profile", "personalization", "data-control"].includes(tab)
      ) {
        setSettingsPopupTab(tab);
      } else {
        setSettingsPopupTab("general");
      }
      setSettingsPopupOpen(true);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#settings" || hash.startsWith("#settings/")) {
        const tab = hash.split("/")[1] as
          | "general"
          | "profile"
          | "personalization"
          | "data-control";
        if (
          ["general", "profile", "personalization", "data-control"].includes(
            tab,
          )
        ) {
          setSettingsPopupTab(tab);
        } else {
          setSettingsPopupTab("general");
        }
        setSettingsPopupOpen(true);
      } else {
        setSettingsPopupOpen(false);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openSettingsPopup = (
    tab: "general" | "profile" | "personalization" | "data-control",
  ) => {
    setSettingsPopupTab(tab);
    setShowMenu(false);
    setSettingsPopupOpen(true);
    window.location.hash = `#settings/${tab}`;
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsPopupOpen(open);
    if (!open) {
      window.location.hash = "";
    }
  };

  const handleLogoutClick = () => {
    setShowMenu(false);
    setAlertOpen(true);
  };

  return (
    <div className="flex flex-col gap-2 my-4 mx-1.5 xl:mx-2">
      <div className="flex items-center">
        {token ? (
          <div className="relative w-full" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 w-full p-1.5 xl:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#212121] transition-colors cursor-pointer"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar || "github.com"} />
                <AvatarFallback className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 text-sm">
                  {profile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-start flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {loading ? "Loading..." : profile?.name || "User"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Free
                </span>
              </div>
            </button>

            {showMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl mx-2 py-1 z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/upgrade");
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
                >
                  <Crown size={15} /> Upgrade Plan
                </button>
                <button
                  onClick={() => openSettingsPopup("personalization")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
                >
                  <Palette size={15} /> Personalization
                </button>
                <button
                  onClick={() => openSettingsPopup("profile")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
                >
                  <User size={15} /> Profile
                </button>
                <button
                  onClick={() => openSettingsPopup("general")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
                >
                  <Settings size={15} /> Settings
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-[#303841] transition cursor-pointer"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}

            <ConfirmDialog
              open={alertOpen}
              onOpenChange={setAlertOpen}
              title="Log Out"
              description="Are you sure you want to log out? You'll need to log in again to access your account."
              confirmLabel="Logout"
              cancelLabel="Cancel"
              onConfirm={onLogout}
              variant="destructive"
            />
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={onLogin}
            className="text-gray-900 dark:text-white w-full active:scale-105 cursor-pointer border-gray-300 dark:border-gray-600"
          >
            <IoMdLogIn className="mr-1" /> Login
          </Button>
        )}
      </div>

      <SettingsPopup
        open={settingsPopupOpen}
        onOpenChange={handleSettingsOpenChange}
        initialTab={settingsPopupTab}
      />
    </div>
  );
};

export default SidebarFooter;
