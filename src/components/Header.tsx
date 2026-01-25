import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Menu, X, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a 
            href="/"
            className="flex items-center gap-2.5 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center group-hover:bg-coral-dark transition-colors">
              <Home className="w-4.5 h-4.5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Proper<span className="text-coral">Tea</span>
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <a 
              href="/explore"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
            >
              Explore
            </a>
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full gap-2">
              <Globe className="w-4 h-4" />
              EN
            </Button>
            {!isLoading && (
              user ? (
                <Button 
                  variant="coral" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => navigate('/auth')}
                  >
                    Sign in
                  </Button>
                  <Button 
                    variant="coral" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => navigate('/auth')}
                  >
                    Get started
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-6 space-y-2"
          >
            <a 
              href="/explore"
              className="block px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </a>
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`} 
                className="block px-4 py-3 text-foreground hover:bg-secondary rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border mt-4">
              {!isLoading && (
                user ? (
                  <Button 
                    variant="coral" 
                    className="w-full rounded-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full rounded-full"
                      onClick={() => navigate('/auth')}
                    >
                      Sign in
                    </Button>
                    <Button 
                      variant="coral" 
                      className="w-full rounded-full"
                      onClick={() => navigate('/auth')}
                    >
                      Get started
                    </Button>
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
