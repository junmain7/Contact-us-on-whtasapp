import { headers } from "next/headers";
import { adminDb } from "../lib/firebaseAdmin";

// Force this route to always run fresh on the server — never statically
// cached, so the number is always current.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server Component. We fetch the number here (bypassing Firestore rules
// via firebaseAdmin), then render a plain inline <script> that fires
// window.location.replace() the instant the browser parses it — before
// React even hydrates. This avoids both:
//  1. next/navigation's redirect() crashing on intent:// URLs
//  2. the "Redirecting..." flash caused by waiting for a client
//     component's useEffect to run after hydration
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

  // Note: root layout.js already provides the <html>/<body> wrapper, so we
  // only return the fragment that goes inside it. Placing the <script>
  // first means it executes as soon as the browser parses it — before the
  // noscript fallback below is even painted.
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(targetUrl)});`,
        }}
      />
      <noscript>
        JavaScript is disabled. Tap here to continue:{" "}
        <a href={waUrl}>Open WhatsApp</a>
      </noscript>
    </>
  );
}
