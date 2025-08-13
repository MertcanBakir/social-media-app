import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const fmt = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "";
  }
};


function TweetCard({ tweet, isLiked, onToggleLike }) {
  return (
    <article className="tweetCard">
      {tweet.mediaUrl && tweet.mediaType === "image" && (
        <img className="tweetMedia" src={tweet.mediaUrl} alt="media" />
      )}
      {tweet.mediaUrl && tweet.mediaType === "video" && (
        <video className="tweetMedia" src={tweet.mediaUrl} controls />
      )}

      {tweet.content && <p className="tweetText">{tweet.content}</p>}

      <footer className="tweetFooter">
        <span className="tweetDate">{fmt(tweet.createdAt)}</span>

        <button
          className={`likeBtn ${isLiked ? "liked" : ""}`}
          onClick={() => onToggleLike(tweet)}
          aria-pressed={isLiked}
          title={isLiked ? "Beğenmekten vazgeç" : "Beğen"}
        >
          <span className="heart">❤️</span>
          <span className="likeCount">{tweet.likeCount ?? 0}</span>
        </button>
      </footer>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const API = useMemo(() => "http://localhost:8080", []);

  const [tab, setTab] = useState("all");
  const [tweets, setTweets] = useState([]);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [err, setErr] = useState("");
  const [firstPageLoaded, setFirstPageLoaded] = useState(false);

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [posting, setPosting] = useState(false);

  const [likedIds, setLikedIds] = useState(() => new Set());

  const isLoggedIn =
    typeof window !== "undefined" &&
    localStorage.getItem("isLoggedIn") === "true";

  const dedupeById = (arr) => {
    const m = new Map();
    for (const t of arr) m.set(t.id, t);
    return Array.from(m.values());
  };

  useEffect(() => {
    setTweets([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    setErr("");
    setFirstPageLoaded(false);
  }, [tab]);

  const loadPage = useCallback(
    async (p) => {
      if (loadingRef.current || !hasMore) return;
      if (tab === "following" && !isLoggedIn) return;

      loadingRef.current = true;
      setLoading(true);
      setErr("");

      try {
        const base =
          tab === "following"
            ? `${API}/tweet/following`
            : `${API}/tweet/tweet`;
        const url = `${base}?page=${p}`;

        const res = await fetch(url, {
          method: "GET",
          credentials: tab === "following" ? "include" : "same-origin",
        });

        if (!res.ok) {
          if (tab === "following" && res.status === 401) {
            setErr("Takip edilenleri görmek için giriş yapın.");
          } else {
            setErr("Akış yüklenemedi.");
          }
          setHasMore(false);
          return;
        }

        const data = await res.json();
        const next = Array.isArray(data.tweets) ? data.tweets : [];

        setTweets((prev) => dedupeById([...prev, ...next]));

        const more = (data.currentPage || p) < (data.totalPages || 0);
        setHasMore(more);

        const np = p + 1;
        setPage(np);
        pageRef.current = np;

        if (!firstPageLoaded) setFirstPageLoaded(true);
      } catch {
        setErr("Bağlantı hatası.");
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [tab, hasMore, isLoggedIn, firstPageLoaded, API]
  );

  useEffect(() => {
    if (tab === "following" && !isLoggedIn) return;
    loadPage(1);
  }, [tab, loadPage, isLoggedIn]);

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!firstPageLoaded) return;
    if (tab === "following" && !isLoggedIn) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
          loadPage(pageRef.current);
        }
      },
      { rootMargin: "600px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [firstPageLoaded, loadPage, hasMore, isLoggedIn, tab]);

  const handleCreate = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!content && !file) return;

    try {
      setPosting(true);
      const fd = new FormData();
      if (content) fd.append("content", content);
      if (file) fd.append("file", file);

      const res = await fetch(`${API}/tweet/create`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gönderi paylaşılamadı");

      const created = await res.json();
      setContent("");
      setFile(null);
      setTweets((prev) => dedupeById([created, ...prev]));
    } catch (e) {
      alert(e.message || "Bir şeyler ters gitti");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (tweet) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const id = tweet.id;
    const already = likedIds.has(id);

    setTweets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, likeCount: Math.max(0, (t.likeCount || 0) + (already ? -1 : 1)) }
          : t
      )
    );
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (already) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (!already) {
        const res = await fetch(`${API}/like/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tweetId: id }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "Beğenme başarısız");
        }
      } else {
        const res = await fetch(`${API}/like/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tweetId: id }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "Beğeni geri çekme başarısız");
        }
      }
    } catch (e) {
      // rollback
      setTweets((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, likeCount: Math.max(0, (t.likeCount || 0) + (already ? 1 : -1)) }
            : t
        )
      );
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (already) next.add(id);
        else next.delete(id);
        return next;
      });
      console.warn("Like toggle error:", e.message);
    }
  };

  const composeBox = useMemo(() => {
    if (!isLoggedIn) return null;
    return (
      <div className="compose">
        <textarea
          placeholder="Ne oluyor?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="composeRow">
          <label className="fileBtn">
            Medya Ekle
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            onClick={handleCreate}
            disabled={posting || (!content && !file)}
          >
            {posting ? "Gönderiliyor..." : "Paylaş"}
          </button>
        </div>
      </div>
    );
  }, [isLoggedIn, content, posting]);

  return (
    <div className="homeWrap">
      <div className="feed">
        <div className="tabs">
          <button
            className={tab === "all" ? "tab active" : "tab"}
            onClick={() => setTab("all")}
          >
            Tümü
          </button>
          <button
            className={tab === "following" ? "tab active" : "tab"}
            onClick={() => setTab("following")}
          >
            Takip Edilenler
          </button>
        </div>

        {isLoggedIn && <div className="card">{composeBox}</div>}

        {tab === "following" && !isLoggedIn && (
          <div className="card cta">
            <p>Takip ettiklerinin gönderilerini görmek için giriş yap.</p>
            <button onClick={() => navigate("/login")}>Giriş Yap</button>
          </div>
        )}

        {tweets.map((t) => (
          <TweetCard
            key={t.id}
            tweet={t}
            isLiked={likedIds.has(t.id)}
            onToggleLike={toggleLike}
          />
        ))}

        {err && <div className="hint">{err}</div>}
        {loading && <div className="hint">Yükleniyor…</div>}
        {!hasMore && tweets.length > 0 && (
          <div className="hint muted">Hepsi bu kadar 🎉</div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}