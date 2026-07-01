import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";
import { isAuthed } from "../../../../lib/session";

// Diye gaye id wala number ko config/whatsapp.number me copy kar deta hai —
// yehi field app/page.js aur app/chat/page.js dono redirect ke liye
// read karte hain, isliye unmein koi change nahi karna pada.
export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const docSnap = await adminDb.collection("numbers").doc(id).get();
    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: "Number not found" }, { status: 404 });
    }

    const { number } = docSnap.data();

    await adminDb
      .collection("config")
      .doc("whatsapp")
      .set({ number, activeId: id }, { merge: true });

    return NextResponse.json({ ok: true, number });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
