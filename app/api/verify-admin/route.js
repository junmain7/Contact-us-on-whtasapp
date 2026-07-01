import { NextResponse } from "next/server";

// Runs only on the server. process.env.ADMIN_PASSWORD is NEVER sent to the browser
// because it does not have the NEXT_PUBLIC_ prefix.
export async function POST(req) {
  try {
    const { password } = await req.json();
    const correct = process.env.ADMIN_PASSWORD;

    if (!correct) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_PASSWORD not set on server" },
        { status: 500 }
      );
    }

    if (password === correct) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}
