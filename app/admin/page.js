"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [checking, setChecking] = useState(false);

  const [currentNumber, setCurrentNumber] = useState(null);
  const [inputNumber, setInputNumber] = useState("");
  const [status, setStatus] = useState(""); // "", "saving", "saved", "error"

  // Live listener — updates instantly if number is changed from anywhere
  useEffect(() => {
    if (!authed) return;
    const ref = doc(db, "config", "whatsapp");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const num = snap.data().number || "";
          setCurrentNumber(num);
          setInputNumber(num);
        } else {
          setCurrentNumber("");
        }
      },
      (err) => {
        console.error(err);
        setStatus("error");
      }
    );
    return () => unsub();
  }, [authed]);

  async function handleSave(e) {
    e.preventDefault();
    const cleaned = inputNumber.replace(/[^0-9]/g, ""); // digits only, no +, no spaces
    if (!cleaned || cleaned.length < 10) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/set-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput, number: cleaned }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("saved");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setChecking(true);
    setLoginError("");
    try {
      const res = await fetch("/api/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthed(true);
      } else {
        setLoginError(
          data.error === "ADMIN_PASSWORD not set on server"
            ? "Server pe ADMIN_PASSWORD env var set nahi hai"
            : "Galat password"
        );
      }
    } catch (err) {
      setLoginError("Connection error");
    } finally {
      setChecking(false);
    }
  }

  if (!authed) {
    return (
      <div style={styles.wrap}>
        <form style={styles.card} onSubmit={handleLogin}>
          <h2 style={styles.heading}>Admin Login</h2>
          <input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={checking}>
            {checking ? "Checking..." : "Login"}
          </button>
          {loginError && <p style={styles.errorMsg}>❌ {loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={handleSave}>
        <h2 style={styles.heading}>WhatsApp Number Set Karo</h2>

        <p style={styles.currentLabel}>
          Current number:{" "}
          <b>{currentNumber === null ? "loading..." : currentNumber || "Not set"}</b>
        </p>

        <input
          type="tel"
          placeholder="e.g. 918011122233"
          value={inputNumber}
          onChange={(e) => setInputNumber(e.target.value)}
          style={styles.input}
        />
        <p style={styles.hint}>
          Country code ke saath, bina + aur space ke likhna (e.g. India ke liye 91 se start).
        </p>

        <button type="submit" style={styles.button} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save Number"}
        </button>

        {status === "saved" && <p style={styles.success}>✅ Number update ho gaya (live)</p>}
        {status === "error" && <p style={styles.errorMsg}>❌ Kuch galat number ya connection issue</p>}
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
    fontFamily: "sans-serif",
    padding: 16,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: 360,
  },
  heading: { marginTop: 0, marginBottom: 16, fontSize: 18 },
  currentLabel: { fontSize: 14, color: "#333", marginBottom: 12 },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: 8,
    boxSizing: "border-box",
  },
  hint: { fontSize: 12, color: "#777", marginTop: 0, marginBottom: 16 },
  button: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    border: "none",
    background: "#25D366",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  success: { color: "green", fontSize: 14, marginTop: 12 },
  errorMsg: { color: "red", fontSize: 14, marginTop: 12 },
};
