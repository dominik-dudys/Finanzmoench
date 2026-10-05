import {Link, Outlet} from "react-router";
import {buttonVariants} from "@/ui-components/ui/button.tsx";
import {AvatarUserMenu} from "@/app/layout/avatar-user-menu.tsx";
import {FooterComponent} from "@/shared/components/footer-component.tsx";

const NAV_ITEMS = [
    {to: "/dashboard", label: "Dashboard"},
    {to: "/household", label: "Haushalte"},
    {to: "/cost", label: "Kosten"},
    {to: "/kategorien", label: "Kategorien"},
    {to: "/jeremy", label: "JeremyAI"},
];

export function DashboardLayout() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b bg-background p-4">
                <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/*Linke Seite*/}
                    <div className="flex items-center">
                        <Link to="/dashboard">
                            <img src="/finanzmoench-logo-text-transparent.png" alt="finanzmönch" className="h-10"/>
                        </Link>
                    </div>

                    {/*Mitte*/}
                    <div className="flex items-center justify-center gap-4">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={buttonVariants({
                                    variant: "outline",
                                    className: "h-10 border-transparent text-gray-600",
                                })}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/*Rechte Seite*/}
                    <div className="flex items-center justify-end gap-4">
                        <AvatarUserMenu/>
                    </div>
                </nav>
            </header>
            <main className="flex-1">
                <Outlet/>
            </main>

            <FooterComponent/>
        </div>
    )
}