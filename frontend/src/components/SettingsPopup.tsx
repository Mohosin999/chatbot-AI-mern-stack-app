import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppStore";
import {
  updateCustomInstructions,
  updateName,
  deleteAccount,
} from "@/features/user/userSlice";
import { deleteAllChats } from "@/features/chat/chatSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import {
  X,
  User,
  Database,
  Settings,
  Sun,
  Moon,
  Monitor,
  Palette,
  Trash2,
} from "lucide-react";
import { CustomAlertDialog } from "./CustomAlertDialog";

const SYSTEM_PROMPT_MAX_TOKENS = 6_400;

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

type SettingsTab = "general" | "personalization" | "profile" | "data-control";

interface SettingsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: SettingsTab;
}

const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: "general", label: "General", icon: <Settings size={18} /> },
  {
    key: "personalization",
    label: "Personalization",
    icon: <Palette size={18} />,
  },
  { key: "profile", label: "Profile", icon: <User size={18} /> },
  { key: "data-control", label: "Data Control", icon: <Database size={18} /> },
];

const SettingsPopup = ({
  open,
  onOpenChange,
  initialTab,
}: SettingsPopupProps) => {
  const dispatch = useDispatch();
  const { profile, updating } = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab || "general",
  );
  const [instructions, setInstructions] = useState(
    profile?.customInstructions || "",
  );
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem("theme") || "light",
  );
  const [nameInput, setNameInput] = useState(profile?.name || "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllChatsConfirmOpen, setDeleteAllChatsConfirmOpen] =
    useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // ── (removed mobileView state) ──

  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeMode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (open) {
      setInstructions(profile?.customInstructions || "");
      setNameInput(profile?.name || "");
      if (initialTab) setActiveTab(initialTab);
    }
  }, [open, profile?.customInstructions, profile?.name, initialTab]);

  const tokenCount = useMemo(
    () => estimateTokens(instructions),
    [instructions],
  );
  const overLimit = tokenCount > SYSTEM_PROMPT_MAX_TOKENS;

  const handleSaveInstructions = async () => {
    const res = await dispatch(updateCustomInstructions(instructions) as any);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Custom instructions saved");
      onOpenChange(false);
    } else {
      toast.error(res.payload || "Failed to save");
    }
  };

  const handleUpdateName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 5 || trimmed.length > 50) {
      toast.error("Name must be 5-50 characters");
      return;
    }
    const res = await dispatch(updateName(trimmed) as any);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Name updated");
    } else {
      toast.error(res.payload || "Failed to update name");
    }
  };

  const handleDeleteAllChats = async () => {
    setDeleteAllChatsConfirmOpen(false);
    const res = await dispatch(deleteAllChats() as any);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("All chats deleted");
    } else {
      toast.error(res.payload || "Failed to delete all chats");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteConfirmOpen(false);
    const res = await dispatch(deleteAccount() as any);
    if (res.meta.requestStatus === "fulfilled") {
      const { persistor } = await import("@/store/store");
      await persistor.flush();
      await persistor.purge();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("theme");
      window.location.reload();
    } else {
      toast.error(res.payload || "Failed to delete account");
    }
  };

  // ── Small screen: selected tab changes ──
  const handleMobileTabSelect = (tab: SettingsTab) => {
    setActiveTab(tab);
    window.location.hash = `#settings/${tab}`;
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* ── Mobile: solid full-screen; Desktop: dimmed centered overlay ── */}
      <div
        className="fixed inset-0 z-100 bg-white dark:bg-[#1e1e1e] lg:bg-black/30 dark:lg:bg-[#1e1e1e]/30 lg:flex lg:items-center lg:justify-center"
        onClick={() => onOpenChange(false)}
      >
        {/* ── Mobile: fills viewport; Desktop: centered modal ── */}
        <div
          className="relative flex bg-white dark:bg-[#1e1e1e] h-full w-full overflow-hidden lg:rounded-xl lg:w-[840px] lg:max-w-[90vw] lg:h-[560px] lg:max-h-[85vh] lg:shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer hidden lg:block"
          >
            <X size={20} />
          </button>

          {/* ═══════════════════════════════════════════════════════════════
            Small screen (< md): Full screen layout
            Top bar: Back (left) — Title (center) — Close (right)
            Horizontal scrollable tab buttons below
            Content below tabs
            ═══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col w-full h-full lg:hidden">
            {/* ── Small screen: top bar with title (left), close (right) ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Settings
              </span>
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Small screen: horizontal scrollable tab buttons ── */}
            <div
              ref={tabsScrollRef}
              className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleMobileTabSelect(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    activeTab === tab.key
                      ? "bg-[#48A4FF] text-white"
                      : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#303841] hover:bg-gray-200 dark:hover:bg-[#3a4553]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Small screen: tab content below tabs ── */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderTabContent(activeTab)}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
            Medium and up: original sidebar + content layout
            ═══════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:flex-col w-56 shrink-0 bg-gray-50 dark:bg-[#252525] p-4 border-r border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
              Settings
            </h2>
            <nav className="flex flex-col gap-1 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    window.location.hash = `#settings/${tab.key}`;
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-start cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-[#48A4FF] text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#303841] hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex lg:flex-col flex-1 p-6 overflow-y-auto">
            {renderTabContent(activeTab)}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );

  // ── Shared tab content renderer ──
  function renderTabContent(tab: SettingsTab) {
    if (tab === "profile") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar || ""} />
              <AvatarFallback className="text-gray-900 bg-gray-200 dark:bg-gray-700 dark:text-white text-xl">
                {profile?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {profile?.name || "User"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.email || ""}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Name
              </label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[#48A4FF] text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleUpdateName}
                disabled={updating}
                className="px-4 py-2 text-sm rounded-lg bg-[#48A4FF] text-white hover:bg-[#3a8ee8] disabled:opacity-50 cursor-pointer"
              >
                {updating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              Danger Zone
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Once you delete your account, there is no going back. All your
              data and chats will be permanently removed.
            </p>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>

          <CustomAlertDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="Delete Account"
            description={
              <>
                Are you sure? This action{" "}
                <span className="font-semibold text-red-400">
                  cannot be undone
                </span>
                .
              </>
            }
            bulletPoints={[
              "Your profile and all personal data will be permanently deleted.",
              "All your chats and conversation history will be lost forever.",
              "You will be logged out and redirected to the login page.",
              "Any active subscriptions or plans will be terminated.",
            ]}
            confirmLabel="Confirm Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteAccount}
            variant="destructive"
          />
        </div>
      );
    }

    if (tab === "personalization") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personalization
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Instructions for Chatbot
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              These instructions will be included in every prompt you send to
              the AI.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Always respond in Bengali. Be concise and use simple language."
              rows={8}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-[#48A4FF] text-gray-900 dark:text-white placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs ${overLimit ? "text-red-500 font-medium" : tokenCount > SYSTEM_PROMPT_MAX_TOKENS * 0.8 ? "text-yellow-500" : "text-gray-400"}`}
              >
                {tokenCount.toLocaleString()} /{" "}
                {SYSTEM_PROMPT_MAX_TOKENS.toLocaleString()} tokens
                {overLimit &&
                  ` — exceeds limit by ${(tokenCount - SYSTEM_PROMPT_MAX_TOKENS).toLocaleString()} tokens`}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInstructions}
              disabled={updating || overLimit}
              className="px-4 py-2 text-sm rounded-lg bg-[#48A4FF] text-white hover:bg-[#3a8ee8] disabled:opacity-50 cursor-pointer"
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      );
    }

    if (tab === "general") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            General
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Theme
            </label>
            <div className="flex gap-2">
              {[
                { value: "light", label: "Light", icon: <Sun size={16} /> },
                { value: "dark", label: "Dark", icon: <Moon size={16} /> },
                {
                  value: "system",
                  label: "System",
                  icon: <Monitor size={16} />,
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setThemeMode(option.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    themeMode === option.value
                      ? "bg-[#48A4FF] text-white"
                      : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (tab === "data-control") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Control
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your data and privacy settings.
          </p>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Delete all chats
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Permanently remove all your conversations.
                </p>
              </div>
              <button
                onClick={() => setDeleteAllChatsConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <CustomAlertDialog
            open={deleteAllChatsConfirmOpen}
            onOpenChange={setDeleteAllChatsConfirmOpen}
            title="Delete All Chats"
            description={
              <>
                Are you sure? This action{" "}
                <span className="font-semibold text-red-400">
                  cannot be undone
                </span>
                .
              </>
            }
            bulletPoints={[
              "All your chats and conversation history will be permanently deleted.",
              "Your account and profile settings will remain unchanged.",
              "This action cannot be reversed.",
            ]}
            confirmLabel="Confirm Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteAllChats}
            variant="destructive"
          />
        </div>
      );
    }

    return null;
  }
};

export default SettingsPopup;
