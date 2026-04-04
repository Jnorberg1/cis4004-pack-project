import { Navigate, Outlet } from "react-router-dom";

function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

export default function GuestOnly() {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
