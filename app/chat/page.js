"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ChatRedirect() {
  const [error, setError] = useState(false);

  useEffect(() => {
    async function go() {
      try {
        const snap = await getDoc(doc(db, "config", "whatsapp"));
        if (!snap.exists()) throw new Error("no config");
        const { number } = snap.data();
        window.location.href = `https://wa.me/${number}`;
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
