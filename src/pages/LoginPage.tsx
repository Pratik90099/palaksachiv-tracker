import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLES, UserRole } from "@/lib/mock-data";
import { Shield, ArrowRight, Lock, Building2, Globe2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-[45%] gov-hero-section flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full border border-primary-foreground/20" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border border-primary-foreground/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-primary-foreground/15" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">GS Portal</h1>
              <p className="text-xs opacity-70">Government of Maharashtra</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-extrabold leading-tight font-display">
              Guardian Secretary<br />
              <span className="gov-gradient-text">District Monitoring</span><br />
              Portal
            </h2>
            <p className="text-sm opacity-70 mt-4 max-w-md leading-relaxed">
              Digital Governance Platform for structured quarterly visit management, 
              issue tracking, and inter-departmental coordination across all 36 districts of Maharashtra.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Building2, label: "36 Districts", sub: "Complete coverage" },
              { icon: Globe2, label: "Real-time", sub: "Live monitoring" },
              { icon: Lock, label: "Parichay SSO", sub: "Secure access" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-primary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-primary-foreground/10"
              >
                <item.icon className="h-5 w-5 mb-2 opacity-80" />
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[10px] opacity-60">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] opacity-40">
            © 2025 Government of Maharashtra. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">GS Portal</h1>
              <p className="text-[10px] text-muted-foreground">Government of Maharashtra</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground font-display">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select your role to access the portal (Demo Mode)
            </p>
          </div>

          {/* Parichay SSO button */}
          <button className="w-full mb-6 py-3.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Sign in with Parichay SSO
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Demo Role Selection</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {USER_ROLES.map((role, i) => (
              <motion.button
                key={role.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => handleLogin(role.value)}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-secondary/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                    {role.count}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{role.label}</p>
                    <p className="text-[10px] text-muted-foreground">{role.count} user{role.count > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-6">
            In production, authentication will be exclusively through Parichay SSO.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
