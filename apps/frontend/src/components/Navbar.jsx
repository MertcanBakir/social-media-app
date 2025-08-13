import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileImage, setProfileImage] = useState("/images/user.png");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); 
  const [err, setErr] = useState("");
  const [active, setActive] = useState(-1); 

  const boxRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    if (loggedIn) fetchProfileImage();
    else setProfileImage("/images/user.png");
  }, [location]);

  const fetchProfileImage = async () => {
    try {
      const res = await fetch("http://localhost:8080/user/profile/me", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.profile?.profileImage) {
          setProfileImage(data.profile.profileImage);
        }
      }
    } catch (_) {}
  };

  const goHome = () => {
    navigate("/");

    window.location.reload();
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!q || q.trim().length < 2) {
      setResults([]);
      setErr("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr("");

    debounceTimer.current = setTimeout(async () => {
      try {
        const url =
          "http://localhost:8080/user/users/search?query=" +
          encodeURIComponent(q.trim());

        const res = await fetch(url, { method: "GET" });

        if (res.status === 404) {
          setResults([]);
          setErr(""); 
        } else if (!res.ok) {
          setResults([]);
          setErr("Arama başarısız oldu.");
        } else {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        setResults([]);
        setErr("Bağlantı hatası.");
      } finally {
        setLoading(false);
      }
    }, 300); 

    return () => clearTimeout(debounceTimer.current);
  }, [q]);

  
  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((p) => (p + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((p) => (p - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active] ?? results[0];
      if (item) goUser(item.username);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const goUser = (username) => {
    setOpen(false);
    setQ("");
    navigate(`/user/${encodeURIComponent(username)}`);
  };

  return (
    <nav className="navbar">
      <button onClick={goHome} className="logo">social-media-app</button>

      <div className="searchWrap" ref={boxRef}>
        <input
          className="search"
          type="text"
          placeholder="Search users…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {open && (loading || err || results.length > 0 || q.trim().length >= 2) && (
          <div className="searchDrop">
            {loading && <div className="dropHint">Aranıyor…</div>}
            {err && <div className="dropErr">{err}</div>}

            {!loading && !err && results.length === 0 && q.trim().length >= 2 && (
              <div className="dropHint">Sonuç bulunamadı</div>
            )}

            {!loading &&
              !err &&
              results.map((u, i) => (
                <button
                  key={u.id ?? u.username ?? i}
                  className={`dropItem ${i === active ? "active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goUser(u.username)}
                >
                  <div className="dropAvatar">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.username} />
                    ) : (
                      <span>{(u.username || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="dropMeta">
                    <div className="dropName">@{u.username}</div>
                    {u.email && <div className="dropEmail">{u.email}</div>}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {isLoggedIn ? (
        <button onClick={() => navigate("/profile")} className="avatar">
          <img
            src={profileImage}
            alt="Profile"
            className="avatarImage"
            onError={(e) => (e.currentTarget.src = "/images/user.png")}
          />
        </button>
      ) : location.pathname === "/login" ? (
        <button onClick={() => navigate("/register")} className="login">Register</button>
      ) : location.pathname === "/register" ? (
        <button onClick={() => navigate("/login")} className="login">Login</button>
      ) : (
        <button onClick={() => navigate("/login")} className="login">Login</button>
      )}
    </nav>
  );
}