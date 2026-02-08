"use client";

import { useState } from "react";
import ConversationList, {
  type Conversation,
} from "@/components/messages/conversation-list";
import ChatRoom, {
  type Message,
  type ChatUser,
} from "@/components/messages/chat-room";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const conversations: Conversation[] = [
  { id: "1", name: "Yuki", avatar: "/placeholder.svg", lastMessage: "明日のベンチプレスの件、了解です！", time: "10:30", unread: 2, online: true },
  { id: "2", name: "Taro", avatar: "/placeholder.svg", lastMessage: "スクワットのフォーム見てもらえますか？", time: "9:15", unread: 0, online: true },
  { id: "3", name: "Mika", avatar: "/placeholder.svg", lastMessage: "来週のジム予約しました！楽しみです", time: "昨日", unread: 0, online: false },
  { id: "4", name: "Ryo", avatar: "/placeholder.svg", lastMessage: "大会お疲れ様でした！ベスト更新すごい", time: "昨日", unread: 0, online: false },
  { id: "5", name: "Saki", avatar: "/placeholder.svg", lastMessage: "食事管理アプリのおすすめありますか？", time: "月曜", unread: 0, online: true },
];

const chatUsers: Record<string, ChatUser> = {
  "1": { id: "1", name: "Yuki", avatar: "/placeholder.svg", title: "BIG3 合計 320kg", online: true },
  "2": { id: "2", name: "Taro", avatar: "/placeholder.svg", title: "パワーリフティング大会勢", online: true },
  "3": { id: "3", name: "Mika", avatar: "/placeholder.svg", title: "フィットネス初心者", online: false },
  "4": { id: "4", name: "Ryo", avatar: "/placeholder.svg", title: "ボディメイク中級者", online: false },
  "5": { id: "5", name: "Saki", avatar: "/placeholder.svg", title: "減量期トレーニー", online: true },
};

const chatMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "今週末、ベンチプレスの合トレどうですか？", time: "9:42", isMe: false },
    { id: "m2", text: "いいですね！何時頃を考えてますか？", time: "9:45", isMe: true },
    { id: "m3", text: "午前10時くらいはどうでしょう？\n渋谷のゴールドジムで", time: "9:47", isMe: false },
    { id: "m4", text: "渋谷店いいですね。MAXチャレンジしたいので補助お願いできますか？", time: "9:50", isMe: true },
    { id: "m5", text: "もちろん！自分も100kg目指してるのでお互い追い込みましょう", time: "9:52", isMe: false },
    { id: "m6", text: "明日のベンチプレスの件、了解です！", time: "10:30", isMe: false },
  ],
  "2": [
    { id: "m1", text: "Taroさん、こんにちは！", time: "8:30", isMe: true },
    { id: "m2", text: "こんにちは！今日もトレーニングですか？", time: "8:35", isMe: false },
    { id: "m3", text: "スクワットのフォーム見てもらえますか？", time: "9:15", isMe: false },
  ],
  "3": [
    { id: "m1", text: "来週の合トレ、参加できそうですか？", time: "14:00", isMe: true },
    { id: "m2", text: "来週のジム予約しました！楽しみです", time: "14:30", isMe: false },
  ],
  "4": [
    { id: "m1", text: "大会の結果どうでしたか？", time: "18:00", isMe: true },
    { id: "m2", text: "大会お疲れ様でした！ベスト更新すごい", time: "18:20", isMe: false },
  ],
  "5": [
    { id: "m1", text: "減量期の食事管理って何使ってますか？", time: "12:00", isMe: false },
    { id: "m2", text: "MyFitnessPalとあすけんを併用してます！", time: "12:15", isMe: true },
    { id: "m3", text: "食事管理アプリのおすすめありますか？", time: "12:20", isMe: false },
  ],
};

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
  };

  const activeUser = activeId ? chatUsers[activeId] : null;
  const activeMessages = activeId ? chatMessages[activeId] ?? [] : [];

  return (
    <div className="flex h-full overflow-hidden rounded-none lg:rounded-xl lg:border lg:border-border/40">
      <div
        className={cn(
          "h-full w-full shrink-0 border-r border-border/30 bg-background lg:block lg:w-[340px]",
          showChat ? "hidden lg:block" : "block"
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div
        className={cn(
          "h-full flex-1 bg-[#070707]",
          showChat ? "block" : "hidden lg:block"
        )}
      >
        {activeUser ? (
          <ChatRoom
            user={activeUser}
            messages={activeMessages}
            onBack={handleBack}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
              <MessageCircle className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-muted-foreground/50">
                メッセージを選択
              </p>
              <p className="mt-1 text-xs text-muted-foreground/30">
                左のリストから会話を選んでください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
