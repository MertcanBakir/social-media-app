import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./profile.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const api = useMemo(() => "http://localhost:8080", []);

  const [profile, setProfile] = useState({
    userId: "",
    bio: "",
    location: "",
    profileImage: null,
    coverImage: null,
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });


  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [ffLoading, setFfLoading] = useState(false);


  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); 


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/user/profile/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Profil bilgisi alınamadı");

        const data = await res.json();
        if (data?.profile) {
          const p = {
            userId: data.profile.userId || "",
            bio: data.profile.bio || "",
            location: data.profile.location || "",
            profileImage: data.profile.profileImage || null,
            coverImage: data.profile.coverImage || null,
          };
          setProfile(p);
          if (p.profileImage) setProfileImagePreview(p.profileImage);
          if (p.coverImage) setCoverImagePreview(p.coverImage);
        }
      } catch {
        toast.error("Profil bilgileri yüklenemedi");
      }
    })();
  }, [api]);

 const loadFollowersAndFollowing = async () => {
    if (!profile.userId) return;
    setFfLoading(true);
    try {
      const [rf, rfg] = await Promise.all([
        fetch(`${api}/follow/followers`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId }),
        }),
        fetch(`${api}/follow/following`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId }),
        }),
      ]);

      const followersJson = rf.ok ? await rf.json() : {};
      const followingJson = rfg.ok ? await rfg.json() : {};

      setFollowers(Array.isArray(followersJson.followers) ? followersJson.followers : []);
      setFollowing(Array.isArray(followingJson.followings) ? followingJson.followings : []);
    } catch (err) {
      console.error(err);
    } finally {
      setFfLoading(false);
    }
  };


  useEffect(() => {
    if (profile.userId) loadFollowersAndFollowing();
  }, [profile.userId]);


  useEffect(() => {
    const handler = () => {
      if (profile.userId) loadFollowersAndFollowing();
    };
    window.addEventListener("follow-updated", handler);
    return () => window.removeEventListener("follow-updated", handler);
  }, [profile.userId]);

  // --- FILE CHANGE + PREVIEW ---
  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "profile") {
        setProfileImageFile(file);
        setProfileImagePreview(reader.result);
      } else {
        setCoverImageFile(file);
        setCoverImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- UPDATE PROFILE ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("bio", profile.bio ?? "");
      fd.append("location", profile.location ?? "");
      if (profileImageFile) fd.append("profileImage", profileImageFile);
      if (coverImageFile) fd.append("coverImage", coverImageFile);

      const res = await fetch(`${api}/user/profile`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Profil güncellenemedi");

      const data = await res.json();
      const p = {
        userId: data.profile.userId || profile.userId,
        bio: data.profile.bio || "",
        location: data.profile.location || "",
        profileImage: data.profile.profileImage || null,
        coverImage: data.profile.coverImage || null,
      };
      setProfile(p);
      setProfileImageFile(null);
      setCoverImageFile(null);
      if (p.profileImage) setProfileImagePreview(p.profileImage);
      if (p.coverImage) setCoverImagePreview(p.coverImage);

      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profil başarıyla güncellendi");
    } catch (err) {
      toast.error(err.message || "Bir şeyler ters gitti");
    }
  };

  // --- CHANGE PASSWORD ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı");
      return;
    }
    try {
      const res = await fetch(`${api}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwords),
      });
      if (!res.ok) throw new Error("Şifre değiştirilemedi");
      toast.success("Şifre başarıyla değiştirildi");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.message || "Bir şeyler ters gitti");
    }
  };

  // --- LOGOUT ---
  const logOut = async () => {
    try {
      await fetch(`${api}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("isLoggedIn");
    toast.success("Başarıyla çıkış yapıldı");
    setTimeout(() => navigate("/"), 800);
  };


  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
    if (profile.userId) loadFollowersAndFollowing();
  };

  const list = modalType === "followers" ? followers : following;

  return (
    <div className="container">
      <button onClick={() => navigate("/")} className="backButton">← Back</button>
      <button onClick={logOut} className="logoutButton">Logout</button>

      <div className="cards">
        <div className="ffBar">
          <button className="ffPill" onClick={() => openModal("followers")} disabled={ffLoading}>
            <span className="ffCount">{followers.length}</span> Takipçi
          </button>
          <button className="ffPill" onClick={() => openModal("following")} disabled={ffLoading}>
            <span className="ffCount">{following.length}</span> Takip Edilen
          </button>
        </div>

        <div className="card">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Profil Bilgileri</h2>
            <p className="sectionSubtitle">Temel profil bilgilerinizi güncelleyin</p>
          </div>
          <form onSubmit={handleProfileUpdate}>
            <div className="formGrid">
              <div className="inputGroup">
                <label className="label">Biyografi</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Kendinizden kısaca bahsedin..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
              <div className="inputGroup">
                <label className="label">Lokasyon</label>
                <input
                  className="input"
                  placeholder="Şehir, Ülke"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>

              <div className="imageSection">
                <div className="imageUpload">
                  <label className="label">Profil Fotoğrafı</label>
                  <div className="imageUploadContainer">
                    {profileImagePreview && (
                      <div className="imagePreview">
                        <img
                          src={profileImagePreview}
                          alt="Profil"
                          className="profilePreview"
                          onError={(e) => (e.currentTarget.src = "/images/user.png")}
                        />
                      </div>
                    )}
                    <label className="fileUploadButton">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "profile")}
                        className="hiddenFileInput"
                      />
                      <span>Fotoğraf Seç</span>
                    </label>
                  </div>
                </div>

                <div className="imageUpload">
                  <label className="label">Kapak Fotoğrafı</label>
                  <div className="imageUploadContainer">
                    {coverImagePreview && (
                      <div className="imagePreview">
                        <img src={coverImagePreview} alt="Kapak" className="coverPreview" />
                      </div>
                    )}
                    <label className="fileUploadButton">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "cover")}
                        className="hiddenFileInput"
                      />
                      <span>Fotoğraf Seç</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="primaryButton">Profili Güncelle</button>
          </form>
        </div>

        <div className="card">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Güvenlik</h2>
            <p className="sectionSubtitle">Hesap güvenliğinizi güncelleyin</p>
          </div>
          <form onSubmit={handlePasswordChange}>
            <div className="formGrid">
              <div className="inputGroup">
                <label className="label">Mevcut Şifre</label>
                <input
                  className="input"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </div>
              <div className="inputGroup">
                <label className="label">Yeni Şifre</label>
                <input
                  className="input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="secondaryButton">Şifreyi Değiştir</button>
          </form>
        </div>
      </div>

      {modalOpen && (
        <div className="modalOverlay" onClick={() => setModalOpen(false)}>
          <div className="modalPanel" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>{modalType === "followers" ? "Takipçiler" : "Takip Edilenler"}</h3>
              <button className="modalClose" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modalBody">
              {ffLoading ? (
                <div className="modalEmpty">Yükleniyor…</div>
              ) : (modalType === "followers" ? followers : following).length === 0 ? (
                <div className="modalEmpty">
                  {modalType === "followers" ? "Takipçi yok." : "Kimseyi takip etmiyor."}
                </div>
              ) : (
                <ul className="userList">
                  {(modalType === "followers" ? followers : following).map((u) => (
                    <li key={u.id || u.userId} className="userRow">
                      <div className="userAvatar" />
                      <div className="userMeta">
                        <div className="userName">@{u.username || u.name || "user"}</div>
                        {u.email && <div className="userSub">{u.email}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
    </div>
  );
}