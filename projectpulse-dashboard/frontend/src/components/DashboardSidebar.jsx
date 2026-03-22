import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Upload, Link2, LogOut, Zap, BarChart2 } from "lucide-react";
import { clearToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
const navItems = [
  { label: "Chat", path: "/dashboard", icon: MessageSquare },
  { label: "Dashboard", path: "/dashboard/projects", icon: BarChart2 },
  { label: "Upload Dataset", path: "/dashboard/upload", icon: Upload },
  { label: "Connect Jira", path: "/dashboard/jira", icon: Link2 },
];
export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };
  return (
    <aside className="w-56 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-tight">
          ProjectPulse
        </span>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
