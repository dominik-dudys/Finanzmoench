import {Link, Outlet} from "react-router";
import {Button} from "@/ui-components/ui/button.tsx";
import {AvatarUserMenu} from "@/app/layout/avatar-user-menu.tsx";

export function DashboardLayout() {
    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-50 border-b bg-background p-4">
                <nav className="grid grid-cols-3 items-center">
                    {/*Linke Seite*/}
                    <div className="flex items-center">
                        <Link to="/dashboard">
                            <img src="/finanzmoench-logo-text-transparent.png" alt="finanzmönch" className="h-10"/>
                        </Link>
                    </div>

                    {/*Mitte*/}
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" className="text-gray-600 border-transparent h-10">
                            <a href="/dashboard">Dashboard</a>
                        </Button>
                        <Button variant="outline" className="text-gray-600 border-transparent h-10">
                            <a href="/household">Haushalte</a>
                        </Button>
                        <Button variant="outline" className="text-gray-600 border-transparent h-10">
                            <a href="/vertrag">Verträge</a>
                        </Button>
                        <Button variant="outline" className="text-gray-600 border-transparent h-10">
                            <a href="/kategorien">Kategorien</a>
                        </Button>
                        <Button variant="outline" className="text-gray-600 border-transparent h-10">
                            <a href="/jeremy">JeremyAI</a>
                        </Button>
                    </div>

                    {/*Rechte Seite*/}
                    <div className="flex items-center justify-end gap-4">
                    <AvatarUserMenu/>

                    </div>
                </nav>
            </header>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}