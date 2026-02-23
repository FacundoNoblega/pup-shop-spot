import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/catalog/PublicLayout";
import Index from "./pages/Index";
import CatalogPage from "./pages/CatalogPage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public pages wrapped in original design layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/alimentos" element={<CatalogPage />} />
            <Route path="/accesorios" element={<CatalogPage />} />
            <Route path="/higiene" element={<CatalogPage />} />
            <Route path="/venenos" element={<CatalogPage />} />
          </Route>

          {/* Admin - untouched */}
          <Route path="/admin" element={<Admin />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
