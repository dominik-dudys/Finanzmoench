import {Link, Outlet} from "react-router";

export function DashboardLayout() {
    return (
        <div className="min-h-screen">
            <header className="border-b p-4">
                <nav className="flex gap-4">
                    <Link to="/dashboard">
                        <img src="/finanzmoench-logo-text-transparent.png" alt="finanzmönch" className="h-10"/>
                    </Link>
                    <div>Dashboard</div>
                </nav>
            </header>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}