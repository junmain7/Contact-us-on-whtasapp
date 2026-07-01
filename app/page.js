import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { adminDb } from "../lib/firebaseAdmin";

// Force this route to always run fresh on the server — never statically
// cached by Next.js or Vercel's CDN, so the redirect always happens
// server-side with zero flash, every single request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server Component — no "use client", no useEffect.
// Redirect happens on the server before any HTML is sent, so there's
// no page flash. Uses firebaseAdmin (bypasses Firestore rules), so the
// public "allow read: if true" rule on config/whatsapp is no longer needed.
export default async function Home() {
  let number;
  try {
    const snap = await adminDb.collection("config").doc("whatsapp").get();
    if (!snap.exists) throw new Error("no config");
    number = snap.data().number;
    if (!number) throw new Error("empty number");
  } catch (e) {
    return (
      <div style={{ textAlign: "center", marginTop: "40vh", fontFamily: "sans-serif" }}>
        Number not set. Update Firestore config/whatsapp.
      </div>
    );
  }

  const ua = headers().get("user-agent") || "";
  const isAndroid = /android/i.test(ua);
  const waUrl = `https://wa.me/${number}`;

  if (isAndroid) {
    const intentUrl = `intent://send?phone=${number}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(
      waUrl
    )};end`;
    redirect(intentUrl);
  } else {
    redirect(waUrl);
  }
}
