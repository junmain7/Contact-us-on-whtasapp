import { NextResponse } from "next/server";
import {
  createSessionToken,
  isAuthed,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "../../../lib/session";

// Login: password check karke ek httpOnly session cookie set karta hai,
// taaki agli baar password na dalna pade.
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

    if (password !== correct) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}

// Session check: admin page load hote hi ye call hota hai. Cookie valid
// hai to dobara login form nahi dikhta.
export async function GET(req) {
  return NextResponse.json({ ok: isAuthed(req) });
}
