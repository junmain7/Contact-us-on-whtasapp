"use client";
import { useEffect } from "react";

// Client-side navigation. next/navigation's redirect() only handles normal
// http(s) URLs — passing it an intent:// URL throws an uncatchable
// server-side exception. window.location has no such restriction, so we
// do the actual jump here instead.
export default function RedirectClient({ url }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div style={{ textAlign: "center", marginTop: "40vh", fontFamily: "sans-serif" }}>
      Redirecting to WhatsApp...
    </div>
  );
}
