import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
