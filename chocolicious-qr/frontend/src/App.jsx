import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu.jsx";
import OwnerAuthGate from "./pages/owner/OwnerAuthGate.jsx";

// Customer route ("/") is completely unchanged from Phase 1.
// "/owner" is new in Phase 1.5 and is not linked from the customer UI -
// it's only reachable by visiting the URL directly, same as the brief
// asks for (no auth yet, but not advertised either).
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/owner" element={<OwnerAuthGate />} />
      </Routes>
    </BrowserRouter>
  );
}
