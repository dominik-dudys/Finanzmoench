import {createBrowserRouter} from "react-router";
import {MarketingLayout} from "@/app/layout/marketing-layout.tsx";
import {HomePage} from "@/app/home-page.tsx";
import {LoginPage} from "@/features/auth/login-page.tsx";
import {DashboardLayout} from "@/app/layout/dashboard-layout.tsx";
import {DashboardPage} from "@/app/dashboard-page.tsx";
import {RegisterPage} from "@/features/auth/register-page.tsx";
import {ForgotPassword} from "@/app/forgot-password-page.tsx";


export const router = createBrowserRouter([
    {

        element: <MarketingLayout/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: 'login', element: <LoginPage/>},
            {path: 'register', element: <RegisterPage/>},
            {path: 'forgot-password', element: <ForgotPassword/>}
        ],
    },
    {
        element: <DashboardLayout/>,
        children: [
            {path: 'dashboard', element: <DashboardPage/>}
        ]
    }
])