import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      let next = location.state?.from?.pathname || "/";
      if (next === "/login" || next === "/register") next = "/";
      navigate(next, { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="page card auth-card">
      <h1>Login</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="btn-primary">Login</button>
      </form>
    </section>
  );
}