import crypto from "crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 din, seconds me

// ADMIN_PASSWORD ko hi signing secret ke roop me reuse karte hain — koi
// extra env var nahi chahiye. Password badalne se saare purane sessions
// automatically invalid ho jaayenge, jo sahi behaviour hai.
function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD not set on server");
  return secret;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Login successful hone par ek signed token banate hain jisme expiry
// timestamp embed hota hai. Koi DB/session-store maintain nahi karna padta.
export function createSessionToken() {
  const expiry = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = String(expiry);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  if (Date.now() > Number(payload)) return false; // expire ho chuka

  let expected;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Route handlers me NextRequest object seedha pass karo — cookie
// automatically read ho jaayegi.
export function isAuthed(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
