import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="mb-6 text-muted-foreground">The page you're looking for doesn't exist</p>
        <Button variant="touch" onClick={() => window.location.href = '/'}>
          <Home className="w-5 h-5" />
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
