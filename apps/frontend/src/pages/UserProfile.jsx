import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./userProfile.css";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const loggedIn = useMemo(
    () => localStorage.getItem("isLoggedIn") === "true",
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/user/profile/${username}`, {
          credentials: "include",
        });
        if (res.status === 404) {
          navigate("/");
          return;
        }
        const json = await res.json();
        if (alive) setProfile(json.profile);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [username, navigate]);

  useEffect(() => {
    if (!loggedIn || !profile?.userId) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:8080/follow/is-following", {
          method: "POST",         
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: profile.userId }),
        });
        if (!res.ok) {
          setIsFollowing(false);
          return;
        }
        const data = await res.json();
        setIsFollowing(!!data.isFollowing);
      } catch (e) {
        console.error(e);
        setIsFollowing(false);
      }
    })();
  }, [loggedIn, profile?.userId]);

  const handleFollow = async () => {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    if (!profile?.userId) return;

    try {
      setFollowBusy(true);
      const res = await fetch("http://localhost:8080/follow/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: profile.userId }),
      });
      if (!res.ok) throw new Error("Takip edilemedi");
      setIsFollowing(true);
      setProfile(p => p ? { ...p, followersCount: (p.followersCount ?? 0) + 1 } : p);
      window.dispatchEvent(new Event("follow-updated"));
    } catch (e) {
      console.error(e);
      alert(e.message || "Bir hata oluştu");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile?.userId) return;

    try {
      setFollowBusy(true);
      const res = await fetch("http://localhost:8080/follow/unfollow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: profile.userId }),
      });
      if (!res.ok) throw new Error("Takipten çıkılamadı");
      setIsFollowing(false);
      setProfile(p => p ? { ...p, followersCount: Math.max(0, (p.followersCount ?? 0) - 1) } : p);
      window.dispatchEvent(new Event("follow-updated"));
    } catch (e) {
      console.error(e);
      alert(e.message || "Bir hata oluştu");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return <main className="up-container"><div className="up-loading">Yükleniyor…</div></main>;
  }
  if (!profile) {
    return <main className="up-container"><div className="up-empty">Kullanıcı bulunamadı</div></main>;
  }

  const {
    user, bio, location, profileImage, coverImage,
    followersCount = 0, followingCount = 0,
  } = profile;

  return (
    <main className="up-container">
      <section className="up-cover">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="up-coverImg" />
        ) : (
          <div className="up-coverPlaceholder" />
        )}
      </section>

      <section className="up-card">
        <div className="up-avatarRow">
          <div className="up-avatarWrap">
            <img
              src={profileImage || "/images/user.png"}
              alt="Avatar"
              className="up-avatar"
              onError={(e) => (e.currentTarget.src = "/images/user.png")}
            />
          </div>

          <div className="up-meta">
            <h1 className="up-username">@{user?.username}</h1>
            <div className="up-sub">
              <span>{location || "Konum yok"}</span>
              <span className="up-dot">•</span>
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="up-actions">
            {loggedIn && (
              isFollowing ? (
                <button
                  className="up-btn outlined"
                  onClick={handleUnfollow}
                  disabled={followBusy}
                >
                  {followBusy ? "Çıkılıyor..." : "Takipten Çık"}
                </button>
              ) : (
                <button
                  className="up-btn primary"
                  onClick={handleFollow}
                  disabled={followBusy}
                >
                  {followBusy ? "Takip ediliyor..." : "Takip Et"}
                </button>
              )
            )}
            {!loggedIn && (
              <button className="up-btn primary" onClick={() => navigate("/login")}>
                Takip Et (Giriş Yap)
              </button>
            )}
          </div>
        </div>

        {bio && <p className="up-bio">{bio}</p>}

        <div className="up-counters">
          <div className="up-pill">
            <span className="up-count">{followersCount}</span> Takipçi
          </div>
          <div className="up-pill">
            <span className="up-count">{followingCount}</span> Takip edilen
          </div>
        </div>
      </section>
    </main>
  );
}