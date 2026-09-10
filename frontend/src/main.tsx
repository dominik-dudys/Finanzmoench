import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from "@/shared/api/query-client.ts";
import {RouterProvider} from "react-router";
import {router} from "@/app/router.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
          <RouterProvider router={router}/>
      </QueryClientProvider>
  </StrictMode>,
)
