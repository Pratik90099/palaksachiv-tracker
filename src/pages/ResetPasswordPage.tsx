import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, KeyRound, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { csoResetPassword } from "@/lib/cso-auth-client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) setErr("This reset link is missing its token.");
  }, [token]);

  const submit = async () => {
    if (pw.length < 10) return setErr("Password must be at least 10 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setErr("");
    setLoading(true);
    try {
      const res = await csoResetPassword(token, pw);
      if (res.success) {
        toast.success("Password updated. Please sign in.");
        navigate("/login");
      } else {
        setErr(res.error || "Could not reset password.");
      }
    } catch (e: any) {
      setErr(e?.message || "Reset service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password for your CS Office account.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">New password</Label>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }}
                placeholder="At least 10 characters"
                className="pl-10"
                maxLength={128}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Confirm new password</Label>
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={pw2}
                onChange={(e) => { setPw2(e.target.value); setErr(""); }}
                placeholder="Repeat password"
                className="pl-10"
                maxLength={128}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          {err && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{err}</p>
          )}

          <Button onClick={submit} disabled={loading || !token || !pw || !pw2} className="w-full py-3">
            {loading ? "Updating..." : "Update password"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
