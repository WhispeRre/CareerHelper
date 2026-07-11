"use client";

import { Pencil, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function EditorMobileTabBar() {
  const t = useTranslations("editor");
  const { mobileActiveTab, setMobileActiveTab } = useEditorStore();

  return (
    <div className="flex border-b bg-white dark:border-zinc-800 dark:bg-background md:hidden">
      <button
        onClick={() => setMobileActiveTab("edit")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
          mobileActiveTab === "edit"
            ? "border-b-2 border-brand text-brand dark:text-brand"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        )}
      >
        <Pencil className="h-4 w-4" />
        {t("edit")}
      </button>
      <button
        onClick={() => setMobileActiveTab("preview")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
          mobileActiveTab === "preview"
            ? "border-b-2 border-brand text-brand dark:text-brand"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        )}
      >
        <Eye className="h-4 w-4" />
        {t("preview")}
      </button>
    </div>
  );
}
