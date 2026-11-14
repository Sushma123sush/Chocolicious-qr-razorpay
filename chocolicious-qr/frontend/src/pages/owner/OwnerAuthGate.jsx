import { useEffect, useState } from "react";
import OwnerLogin from "./OwnerLogin.jsx";
import OwnerDashboard from "./OwnerDashboard.jsx";
import { getOwnerToken, clearOwnerToken, onOwnerAuthFailed } from "../../services/ownerApiClient.js";

export default function OwnerAuthGate() {
  const [authed, setAuthed] = useState(() => Boolean(getOwnerToken()));

  useEffect(() => {
    return onOwnerAuthFailed(() => setAuthed(false));
  }, []);

  const handleLogout = () => {
    clearOwnerToken();
    setAuthed(false);
  };

  if (!authed) {
    return <OwnerLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="owner-authed-shell">
      <button type="button" className="owner-logout-btn" onClick={handleLogout}>
        Log Out
      </button>
      <OwnerDashboard />
    </div>
  );
}