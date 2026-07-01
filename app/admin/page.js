"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [numbers, setNumbers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingNumbers, setLoadingNumbers] = useState(false);

  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addStatus, setAddStatus] = useState(""); // "", "saving", "error"
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null); // jis number pe activate/delete chal raha hai

  // Page load hote hi check karo ki pehle se koi valid session hai kya —
  // agar hai to login form skip ho jaata hai.
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/verify-admin");
        const data = await res.json();
        if (data.ok) setAuthed(true);
      } catch (e) {
        // ignore — bas login form dikha denge
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (authed) loadNumbers();
  }, [authed]);

  async function loadNumbers() {
    setLoadingNumbers(true);
    setActionError("");
    try {
      const res = await fetch("/api/numbers");
      const data = await res.json();
      if (data.ok) {
        setNumbers(data.numbers);
        setActiveId(data.activeId);
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setActionError("Numbers load nahi ho paaye");
      }
    } catch (e) {
      setActionError("Connection error");
    } finally {
      setLoadingNumbers(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
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
        setPwInput("");
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
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    setAuthed(false);
    setNumbers([]);
    setActiveId(null);
  }

  async function handleAddNumber(e) {
    e.preventDefault();
    const cleaned = newNumber.replace(/[^0-9]/g, "");
    if (!cleaned || cleaned.length < 10) {
      setAddStatus("error");
      return;
    }
    setAddStatus("saving");
    try {
      const res = await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: cleaned, label: newLabel.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewNumber("");
        setNewLabel("");
        setAddStatus("");
        loadNumbers();
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setAddStatus("error");
      }
    } catch (err) {
      setAddStatus("error");
    }
  }

  async function handleActivate(id) {
    setBusyId(id);
    setActionError("");
    try {
      const res = await fetch("/api/numbers/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveId(id);
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setActionError("Active karne me error aaya");
      }
    } catch (err) {
      setActionError("Connection error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setActionError("");
    try {
      const res = await fetch("/api/numbers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        setNumbers((prev) => prev.filter((n) => n.id !== id));
        if (activeId === id) setActiveId(null);
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setActionError("Delete karne me error aaya");
      }
    } catch (err) {
      setActionError("Connection error");
    } finally {
      setBusyId(null);
    }
  }

  if (checkingSession) {
    return (
      <div style={styles.wrap}>
        <p style={{ color: "#777", fontFamily: "sans-serif" }}>Loading...</p>
      </div>
    );
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
          <button type="submit" style={styles.button} disabled={loggingIn}>
            {loggingIn ? "Checking..." : "Login"}
          </button>
          {loginError && <p style={styles.errorMsg}>❌ {loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={{ ...styles.heading, marginBottom: 0 }}>WhatsApp Numbers</h2>
          <button type="button" style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <p style={styles.hint}>
          Jitne chahe numbers add karo, phir jo <b>active</b> karna hai usko select kar do —
          website usi number pe redirect karegi.
        </p>

        <form style={styles.addRow} onSubmit={handleAddNumber}>
          <input
            type="tel"
            placeholder="e.g. 918011122233"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            style={{ ...styles.input, marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Label (optional, e.g. Sales)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ ...styles.input, marginBottom: 8 }}
          />
          <button type="submit" style={styles.button} disabled={addStatus === "saving"}>
            {addStatus === "saving" ? "Adding..." : "+ Add Number"}
          </button>
          {addStatus === "error" && (
            <p style={styles.errorMsg}>❌ Valid number daalo (kam se kam 10 digit)</p>
          )}
        </form>

        <hr style={styles.divider} />

        {loadingNumbers && <p style={styles.hint}>Loading numbers...</p>}
        {actionError && <p style={styles.errorMsg}>❌ {actionError}</p>}

        {!loadingNumbers && numbers.length === 0 && (
          <p style={styles.hint}>Abhi koi number save nahi hai.</p>
        )}

        <ul style={styles.list}>
          {numbers.map((n) => {
            const isActive = n.id === activeId;
            const isBusy = busyId === n.id;
            return (
              <li
                key={n.id}
                style={{ ...styles.listItem, ...(isActive ? styles.listItemActive : {}) }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.numberText}>
                    {n.number} {isActive && <span style={styles.activeBadge}>ACTIVE</span>}
                  </div>
                  {n.label && <div style={styles.labelText}>{n.label}</div>}
                </div>
                <div style={styles.listActions}>
                  {!isActive && (
                    <button
                      type="button"
                      style={styles.selectButton}
                      disabled={isBusy}
                      onClick={() => handleActivate(n.id)}
                    >
                      {isBusy ? "..." : "Select"}
                    </button>
                  )}
                  <button
                    type="button"
                    style={styles.deleteButton}
                    disabled={isBusy}
                    onClick={() => handleDelete(n.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
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
    maxWidth: 420,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heading: { marginTop: 0, marginBottom: 16, fontSize: 18 },
  hint: { fontSize: 12, color: "#777", marginTop: 0, marginBottom: 16 },
  addRow: { marginBottom: 4 },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
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
  logoutButton: {
    padding: "6px 12px",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#fff",
    color: "#555",
    cursor: "pointer",
  },
  divider: { border: "none", borderTop: "1px solid #eee", margin: "16px 0" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #eee",
    marginBottom: 8,
  },
  listItemActive: {
    border: "1px solid #25D366",
    background: "#f0fdf4",
  },
  numberText: { fontSize: 15, fontWeight: 600, color: "#222" },
  labelText: { fontSize: 12, color: "#777", marginTop: 2 },
  activeBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#25D366",
    border: "1px solid #25D366",
    borderRadius: 999,
    padding: "1px 6px",
    marginLeft: 6,
  },
  listActions: { display: "flex", gap: 6, flexShrink: 0 },
  selectButton: {
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid #25D366",
    background: "#fff",
    color: "#25D366",
    fontWeight: 600,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 6,
    border: "1px solid #eee",
    background: "#fff",
    cursor: "pointer",
  },
  success: { color: "green", fontSize: 14, marginTop: 12 },
  errorMsg: { color: "red", fontSize: 14, marginTop: 8 },
};
