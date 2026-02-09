"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function MessageChatRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/messages/${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );
}
