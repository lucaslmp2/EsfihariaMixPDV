// This page redirects to the main app

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This component should not be rendered if we're already at /
    // The routing should handle this, but this is a safety check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
      }
      // If user is authenticated, this component is already displaying the dashboard
      // through the routing system, so no redirect needed
    };

    checkAuth();
  }, [navigate]);

  // This will only render if user is authenticated and at root path
  // The actual dashboard content is handled by the routing in App.tsx
  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-foreground animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L16.5 14.5L18 22L12 18.5L6 22L7.5 14.5L2 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
        <p className="text-muted-foreground">Carregando Esfiharia PDV...</p>
      </div>
    </div>
  );
};

export default Index;