import {createBrowserRouter} from "react-router";
import {MarketingLayout} from "@/app/layout/marketing-layout.tsx";
import {HomePage} from "@/app/pages/home-page.tsx";
import {LoginPage} from "@/features/auth/login-page.tsx";
import {DashboardLayout} from "@/app/layout/dashboard-layout.tsx";
import {RegisterPage} from "@/features/auth/register-page.tsx";
import {ForgotPassword} from "@/app/pages/forgot-password-page.tsx";
import {LoginCallbackPage} from "@/features/auth";
import {ProtectedRoute} from "@/features/auth/protected-route.tsx";
import {DashboardPage} from "@/app/pages/dashboard-page.tsx";
import {VertragPage} from "@/app/pages/vertrag-page.tsx";
import {KategoriePage} from "@/app/pages/kategorie-page.tsx";
import {JeremyPage} from "@/app/pages/jeremy-page.tsx";
import {SettingsPage} from "@/app/pages/settings-page.tsx";
import {ProfilePage} from "@/app/pages/profile-page.tsx";
import {VerifyEmailPage} from "@/app/pages/verify-email-page.tsx";
import {LoginCodePage} from "@/app/pages/login-code-page.tsx";


export const router = createBrowserRouter([
    {

        element: <MarketingLayout/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: 'login', element: <LoginPage/>},
            {path: 'login/code', element: <LoginCodePage/>},
            {path: 'register', element: <RegisterPage/>},
            {path: 'register/verify', element: <VerifyEmailPage/>},
            {path: 'forgot-password', element: <ForgotPassword/>}
        ],
    },
    {
      path: 'auth/callback',
      element: <LoginCallbackPage/>
    },
    {
      element: <ProtectedRoute/>,
      children: [
          {
              element: <DashboardLayout/>,
              children: [
                  {path: 'dashboard', element: <DashboardPage/>},
                  {path: 'vertrag', element: <VertragPage/>},
                  {path: 'kategorien', element: <KategoriePage/>},
                  {path: 'jeremy', element: <JeremyPage/>},
                  {path: 'einstellungen', element: <SettingsPage/>},
                  {path: 'profil', element: <ProfilePage/>},
              ]
          }
      ]
    }
])