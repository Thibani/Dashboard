import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initialsFor(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        Dashboard
      </Link>

      <div className="app-header-profile" ref={menuRef}>
        {isAuthenticated && user ? (
          <>
            <button
              className="app-header-avatar"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {initialsFor(user.email)}
            </button>
            {menuOpen && (
              <div className="app-header-menu">
                <p className="app-header-menu-email">{user.email}</p>
                <button onClick={logout}>Log out</button>
              </div>
            )}
          </>
        ) : (
          <div className="app-header-auth-links">
            <Link to="/login">Log in</Link>
            <Link to="/register" className="app-header-cta">
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}