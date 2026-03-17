import { useAuth } from "@/lib/auth-context";
import { User, Mail, Building2, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user } = useAuth();

  const roleLabel = user?.role === "guardian_secretary" ? "Guardian Secretary" :
    user?.role === "department_secretary" ? "Department Secretary" :
    user?.role === "district_collector" ? "District Collector" :
    user?.role === "divisional_commissioner" ? "Divisional Commissioner" :
    user?.role === "chief_secretary" ? "Chief Secretary" :
    user?.role === "cmo" ? "Chief Minister's Office" : "System Administrator";

  const infoItems = [
    { icon: User, label: "Name", value: user?.name },
    { icon: Shield, label: "Designation", value: user?.designation },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Building2, label: "Role", value: roleLabel },
    ...(user?.district ? [{ icon: MapPin, label: "District", value: user.district }] : []),
    ...(user?.department ? [{ icon: Building2, label: "Department", value: user.department }] : []),
    ...(user?.division ? [{ icon: MapPin, label: "Division", value: user.division }] : []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-display">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account information</p>
      </motion.div>

      <div className="gov-card-elevated space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.designation}</p>
          </div>
        </div>

        <div className="space-y-3">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
