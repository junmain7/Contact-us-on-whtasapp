import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";
import { isAuthed } from "../../../lib/session";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

// Saare saved numbers + current active id return karta hai
export async function GET(req) {
  if (!isAuthed(req)) return unauthorized();

  try {
    const [numbersSnap, configSnap] = await Promise.all([
      adminDb.collection("numbers").orderBy("createdAt", "asc").get(),
      adminDb.collection("config").doc("whatsapp").get(),
    ]);

    const numbers = numbersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const activeId = configSnap.exists ? configSnap.data().activeId || null : null;

    return NextResponse.json({ ok: true, numbers, activeId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// Naya number list me add karta hai (isse automatically active nahi hota)
export async function POST(req) {
  if (!isAuthed(req)) return unauthorized();

  try {
    const { number, label } = await req.json();
    const cleaned = (number || "").replace(/[^0-9]/g, "");

    if (!cleaned || cleaned.length < 10) {
      return NextResponse.json({ ok: false, error: "Invalid number" }, { status: 400 });
    }

    const docRef = await adminDb.collection("numbers").add({
      number: cleaned,
      label: (label || "").trim(),
      createdAt: Date.now(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// Ek saved number list se delete karta hai
export async function DELETE(req) {
  if (!isAuthed(req)) return unauthorized();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await adminDb.collection("numbers").doc(id).delete();

    // Agar yahi number active tha, to active pointer clear kar do
    const configRef = adminDb.collection("config").doc("whatsapp");
    const configSnap = await configRef.get();
    if (configSnap.exists && configSnap.data().activeId === id) {
      await configRef.set({ number: "", activeId: null }, { merge: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
