import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProfilePage from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user/:username" element={<UserProfile />} /> 
      </Routes>
    </>
  );
}