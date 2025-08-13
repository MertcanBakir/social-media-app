import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Hatalı giriş");
      }


      localStorage.setItem("isLoggedIn", "true");

      toast.success("Başarıyla giriş yapıldı");
      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (error) {
      toast.error(error.message || "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <>
      <div className="container">
        <button onClick={goBack} className="backButton">← Back</button>
        <div className="loginbox">
          <h1>Login</h1>
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
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && !submitting && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="button"
              disabled={submitting}
            >
              {submitting ? "Gönderiliyor..." : "Login"}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}