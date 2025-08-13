import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./register.css";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Hatalı kayıt");
      }

      toast.success("Başarıyla kayıt yapıldı");
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      toast.error(error.message || "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => navigate("/login");

  return (
    <>
      <div className="container">
        <button onClick={goBack} className="backButton">← Back</button>

        <div className="loginbox">
          <h1>Register</h1>
          <div className="inputGroup">
            <input
              className="input"
              type="email"
              placeholder="e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="input"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              className="input"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && !submitting && handleRegister()}
            />
            <button
              onClick={handleRegister}
              className="button"
              disabled={submitting}
            >
              {submitting ? "Gönderiliyor..." : "Register"}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}