import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Shield, Lock, Building2, Globe2, ArrowLeft, Mail } from "lucide-react";
import emblem from "@/assets/maharashtra-emblem.png";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/auth-adapter";
import { UserRole } from "@/lib/mock-data";
import { toast } from "sonner";

const ROLES: { value: UserRole; label: string; sub: string }[] = [
  { value: "district_collector", label: "District Collector", sub: "District-level access" },
  { value: "department_secretary", label: "Secretary of Department", sub: "Department-wide access" },
  { value: "guardian_secretary", label: "Palak Sachiv / Guardian Secretary", sub: "Assigned districts" },
  { value: "chief_secretary", label: "Chief Secretary", sub: "State-wide access" },
  { value: "system_admin", label: "Chief Secretary's Office", sub: "Administrative access" },
];

export default function LoginPage() {
  const { setUserFromAdapter } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"identify" | "verify">("identify");
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleSendOtp = async () => {
    setError("");
    if (!role) { setError("Please choose a role."); return; }
    if (!email.trim() || email.length > 255 || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await requestLoginOtp(email, role as UserRole);
      if (!res.sent) {
        if (res.error === "rate_limited") {
          setError("Too many requests. Try again in a few minutes.");
          setResendIn(60);
        } else {
          setError(res.error || "Could not send code.");
        }
        return;
      }
      setStep("verify");
      setResendIn(60);
      if (res.bypass) {
        toast.info("QA test account — use bypass code", { duration: 10000 });
      } else {
        toast.success(`Code sent to ${res.recipientEmail || email}`, {
          description: "Check your inbox (and spam folder).",
        });
      }
    } catch (e: any) {
      setError(e?.message || "Could not send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const user = await verifyLoginOtp(email, role as UserRole, code);
      setUserFromAdapter(user);
      toast.success(`Welcome, ${user.name}`);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Could not verify code.");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep("identify");
    setCode("");
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] gov-hero-section flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full border border-primary-foreground/20" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border border-primary-foreground/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-primary-foreground/15" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={emblem} alt="Government of Maharashtra emblem" className="w-14 h-14 object-contain bg-white rounded-lg p-1" width={56} height={56} />
            <div>
              <h1 className="text-xl font-bold font-display">Guardian Secretary Portal</h1>
              <p className="text-xs opacity-70">Government of Maharashtra</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
              { icon: Lock, label: "OTP Login", sub: "Passwordless" },
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
          <p className="text-[10px] opacity-40">© 2026 Government of Maharashtra. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={emblem} alt="Government of Maharashtra emblem" className="w-12 h-12 object-contain" width={48} height={48} />
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">Guardian Secretary Portal</h1>
              <p className="text-[10px] text-muted-foreground">Government of Maharashtra</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "identify" ? (
              <motion.div key="identify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground font-display">Sign In</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose your role and we'll email you a one-time code
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Sign in as</Label>
                    <Select value={role} onValueChange={(v) => { setRole(v as UserRole); setError(""); }}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{r.label}</span>
                              <span className="text-[10px] text-muted-foreground">{r.sub}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Email Address</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="your.email@gov.in"
                        className="pl-10"
                        maxLength={255}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      The code will be sent to your registered email (and phone, once SMS is enabled).
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <Button onClick={handleSendOtp} disabled={loading} className="w-full py-3">
                    {loading ? "Sending code..." : "Send one-time code"}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center mt-6">
                  Access is limited to officers registered in the Officer Directory.
                </p>
              </motion.div>
            ) : (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <button
                  onClick={restart}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Use a different email
                </button>

                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground font-display">Enter your code</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setError(""); }}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg text-center">{error}</p>
                  )}

                  <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="w-full py-3">
                    {loading ? "Verifying..." : "Verify & sign in"}
                  </Button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendIn > 0 || loading}
                    className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                  </button>
                </div>

                <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground text-center">
                    Didn't get it? Check your spam folder. Code is valid for 10 minutes and locks after 5 wrong attempts.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
