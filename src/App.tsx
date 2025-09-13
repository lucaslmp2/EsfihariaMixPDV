import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Produtos from "./pages/Produtos";
import Pedidos from "./pages/Pedidos";
import Caixa from "./pages/Caixa";
import Clientes from "./pages/Clientes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Define routes using the modern createBrowserRouter API
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "produtos",
        element: <Produtos />,
      },
      {
        path: "pedidos",
        element: <Pedidos />,
      },
      {
        path: "caixa",
        element: <Caixa />,
      },
      {
        path: "clientes",
        element: <Clientes />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;