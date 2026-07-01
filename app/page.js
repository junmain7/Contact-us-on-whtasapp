import { headers } from "next/headers";
import { adminDb } from "../lib/firebaseAdmin";
import RedirectClient from "./RedirectClient";

// Force this route to always run fresh on the server — never statically
// cached by Next.js or Vercel's CDN, so the number is always current.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server Component — fetches the WhatsApp number from Firestore using
// firebaseAdmin (bypasses Firestore rules, so no public read rule needed).
// The actual redirect is delegated to a tiny client component because
// next/navigation's redirect() cannot handle intent:// URLs without
// throwing a server-side exception.
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

  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const isAndroid = /android/i.test(ua);
  const waUrl = `https://wa.me/${number}`;

  const targetUrl = isAndroid
    ? `intent://send?phone=${number}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(
        waUrl
      )};end`
    : waUrl;

  return <RedirectClient url={targetUrl} />;
}
