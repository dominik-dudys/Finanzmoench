import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from "@/shared/api/query-client.ts";
import {RouterProvider} from "react-router";
import {router} from "@/app/router.tsx";
import {AuthProvider} from "@/features/auth";
import {Toaster} from "@/ui-components/ui/sonner";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
          <AuthProvider>
              <RouterProvider router={router}/>
              <Toaster position="bottom-center"/>
          </AuthProvider>
      </QueryClientProvider>
  </StrictMode>,
)
