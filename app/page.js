import { redirect } from "next/navigation";
import { adminDb } from "../lib/firebaseAdmin";

// Force this route to always run fresh on the server — never statically
// cached, so the number is always current.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server Component. We fetch the number here (bypassing Firestore rules
// via firebaseAdmin), then issue a real HTTP redirect straight to
// https://wa.me/<number>.
//
// Why not intent://send?...package=com.whatsapp like before?
// That trick only works in a full browser (Chrome/Safari). When this link
// is opened from *inside* WhatsApp's own in-app browser (i.e. someone
// tapped the link from within a WhatsApp chat), asking Android to open
// "com.whatsapp" while you're already inside WhatsApp's webview causes the
// OS to just close that tab and drop the user back where they came from —
// which is exactly the "wahi wapas aa jaata hai" bug.
//
// https://wa.me/<number> is a verified App Link that every browser and
// in-app webview (WhatsApp, Instagram, Facebook, Chrome, Safari, etc.)
// hands off correctly to the WhatsApp app, straight to that number's chat.
// It's also a plain http(s) URL, so next/navigation's redirect() can be
// used directly (it previously couldn't, since redirect() throws on
// non-http(s) schemes like intent://). A server redirect fires before any
// HTML/JS is even sent, so there's no intermediate page or flash.
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

  redirect(`https://wa.me/${number}`);
}
