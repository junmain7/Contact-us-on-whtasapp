import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { password, number } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const cleaned = (number || "").replace(/[^0-9]/g, "");
    if (!cleaned || cleaned.length < 10) {
      return NextResponse.json({ ok: false, error: "Invalid number" }, { status: 400 });
    }

    await adminDb.collection("config").doc("whatsapp").set({ number: cleaned }, { merge: true });

    return NextResponse.json({ ok: true, number: cleaned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
