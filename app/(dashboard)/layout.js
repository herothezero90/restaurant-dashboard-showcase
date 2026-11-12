import "./dashboard.css";
import { geist, geistMono } from "./fonts";

export default function DashboardLayout({ children }) {
  return <div className={`dashboard-theme admin:min-h-screen ${geist.variable} ${geistMono.variable}`}>{children}</div>;
}
