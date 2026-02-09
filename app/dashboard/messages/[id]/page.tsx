"use client";

import { useParams } from "next/navigation";
import IndividualChatView from "@/components/messages/individual-chat-view";

export default function DashboardMessageChatPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="min-h-[calc(100vh-10rem)] w-full">
      <IndividualChatView conversationId={id} embedded />
    </div>
  );
}
