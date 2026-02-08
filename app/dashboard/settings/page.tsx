import type { Metadata } from "next";
import SettingsPage from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "設定 - FITPEAK",
  description: "アカウントや通知の設定を管理します。",
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
