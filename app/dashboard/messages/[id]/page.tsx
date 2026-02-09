"use client";

import { useParams } from "next/navigation";
import IndividualChatView from "@/components/messages/individual-chat-view";

export default function DashboardMessageChatPage() {
  const params = useParams();
  const id = params.id as string;

  return <IndividualChatView conversationId={id} embedded />;
}
