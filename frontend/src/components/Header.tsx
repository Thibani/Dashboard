import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteAccountRequest } from "../lib/api";

function initialsFor(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function Header() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleDeleteAccount() {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account?\n\nThis action is permanent and cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {

      await deleteAccountRequest(token);

      logout();
      navigate("/login");

    } catch (error) {

      console.error(error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete your account."
      );

    }
  }

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

                <Link to="/connections" onClick={() => setMenuOpen(false)}>
                  Connected accounts
                </Link>

                <button onClick={logout}>
                  Log out
                </button>

                <button onClick={handleDeleteAccount}>
                  Delete account
                </button>
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