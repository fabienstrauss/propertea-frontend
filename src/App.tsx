import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyV2 from "./pages/PropertyV2";
import Explore from "./pages/Explore";
import ExplorePropertyDetail from "./pages/ExplorePropertyDetail";
import NotFound from "./pages/NotFound";
import Space from "./pages/Space";
import SpaceLive from "./pages/SpaceLive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/property/v2/:id" element={<PropertyV2 />} />
            <Route path="/property/:id/live" element={<SpaceLive />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:id" element={<ExplorePropertyDetail />} />
            <Route path="/space/:id" element={<Space />} />
            <Route path="/space/:id/live" element={<SpaceLive />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
