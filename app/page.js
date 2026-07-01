"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  const [error, setError] = useState(false);

  useEffect(() => {
    async function go() {
      try {
        const snap = await getDoc(doc(db, "config", "whatsapp"));
        if (!snap.exists()) throw new Error("no config");
        const { number } = snap.data();

        const isAndroid = /android/i.test(navigator.userAgent);
        if (isAndroid) {
          // Android: intent scheme seedha WhatsApp app open karta hai,
          // interstitial page skip ho jaata hai
          window.location.href = `intent://send?phone=${number}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(
            `https://wa.me/${number}`
          )};end`;
        } else {
          // iOS / Desktop: wa.me / whatsapp:// scheme
          window.location.href = `https://wa.me/${number}`;
        }
      } catch (e) {
        setError(true);
      }
    }
    go();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "40vh", fontFamily: "sans-serif" }}>
      {error ? "Number not set. Update Firestore config/whatsapp." : "Redirecting to WhatsApp..."}
    </div>
  );
}
