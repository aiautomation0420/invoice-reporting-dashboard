"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { dateTime } from "@/lib/format";

// Re-fetches the page's data from the server every minute, without a full reload.
export function LastUpdated({ at }: { at: string }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);
  return <p className="text-xs text-muted">Last updated {dateTime(at)} · refreshes every minute</p>;
}
