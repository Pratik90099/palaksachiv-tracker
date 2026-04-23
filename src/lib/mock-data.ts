// Reference data, enums and UI configs for the GS Portal.
// All transactional data lives in the database (see src/hooks/use-data.ts).

export const MAHARASHTRA_DISTRICTS = [
  "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar", "Dharashiv", "Dhule",
  "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
  "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
  "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri",
  "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
] as const;

export const DIVISIONS = {
  "Pune": ["Pune", "Satara", "Sangli", "Solapur", "Kolhapur"],
  "Nashik": ["Nashik", "Dhule", "Nandurbar", "Jalgaon", "Ahilyanagar"],
  "Aurangabad": ["Chhatrapati Sambhajinagar", "Jalna", "Hingoli", "Parbhani", "Beed", "Dharashiv", "Latur", "Nanded"],
  "Nagpur": ["Nagpur", "Wardha", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli"],
  "Amravati": ["Amravati", "Akola", "Washim", "Buldhana", "Yavatmal"],
  "Konkan": ["Mumbai City", "Mumbai Suburban", "Thane", "Palghar", "Raigad", "Ratnagiri", "Sindhudurg"],
};

export type UserRole =
  | "guardian_secretary"
  | "department_secretary"
  | "district_collector"
  | "divisional_commissioner"
  | "chief_secretary"
  | "cmo"
  | "system_admin";

// Role catalog for the login screen. Live counts are fetched from the
// `officers` table at runtime (see LoginPage.tsx).
export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "guardian_secretary", label: "Guardian Secretary" },
  { value: "department_secretary", label: "Department Secretary" },
  { value: "district_collector", label: "District Collector" },
  { value: "divisional_commissioner", label: "Divisional Commissioner" },
  { value: "chief_secretary", label: "Chief Secretary" },
  { value: "cmo", label: "Chief Minister's Office" },
  { value: "system_admin", label: "Chief Secretary Office" },
];

export type ActionableStatus =
  | "not_started" | "in_progress" | "on_track" | "at_risk"
  | "overdue" | "partially_completed" | "completed_pending_closure"
  | "closed" | "escalated";

export type Priority = "critical" | "high" | "medium" | "low";

export const STATUS_CONFIG: Record<ActionableStatus, { label: string; color: string; bgClass: string }> = {
  not_started: { label: "Not Started", color: "status-not-started", bgClass: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "status-in-progress", bgClass: "bg-gov-info-light text-gov-info" },
  on_track: { label: "On Track", color: "status-on-track", bgClass: "bg-gov-success-light text-gov-success" },
  at_risk: { label: "At Risk", color: "status-at-risk", bgClass: "bg-gov-warning-light text-gov-warning" },
  overdue: { label: "Overdue", color: "status-overdue", bgClass: "bg-gov-danger-light text-gov-danger" },
  partially_completed: { label: "Partially Completed", color: "status-partial", bgClass: "bg-orange-100 text-gov-orange" },
  completed_pending_closure: { label: "Pending Closure", color: "status-pending-closure", bgClass: "bg-teal-100 text-gov-teal" },
  closed: { label: "Closed", color: "status-closed", bgClass: "bg-emerald-100 text-emerald-800" },
  escalated: { label: "Escalated", color: "status-escalated", bgClass: "bg-red-100 text-red-900" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgClass: string }> = {
  critical: { label: "Critical", bgClass: "bg-gov-danger-light text-gov-danger" },
  high: { label: "High", bgClass: "bg-gov-warning-light text-gov-warning" },
  medium: { label: "Medium", bgClass: "bg-gov-info-light text-gov-info" },
  low: { label: "Low", bgClass: "bg-muted text-muted-foreground" },
};

export const ISSUE_CATEGORIES = [
  "Infrastructure", "Urban", "Land Acquisition", "Scheme Implementation",
  "Pragati", "GOI Pending", "Public Health", "Gender Budgeting",
  "Best Practice", "Admin Coordination", "CM Critical", "Other"
] as const;

export const DEPARTMENTS = [
  "Public Works Department (PWD)", "Revenue", "Health", "Education",
  "Agriculture", "Forest", "Rural Development", "Urban Development (UDD)",
  "Water Resources", "Home", "Social Justice", "Women & Child Development",
  "Industry", "Energy", "Transport", "Housing"
] as const;

// Heat-map level configuration used by the Heat Map page.
export type HeatLevel = "high_performing" | "performing" | "moderate" | "needs_attention" | "critical" | "emergency";

export interface DistrictHeatData {
  district: string;
  score: number;
  level: HeatLevel;
  openActionables: number;
  overdueItems: number;
  visitCompleted: boolean;
  criticalIssues: number;
}

export function scoreToLevel(score: number): HeatLevel {
  if (score >= 90) return "high_performing";
  if (score >= 75) return "performing";
  if (score >= 50) return "moderate";
  if (score >= 25) return "needs_attention";
  if (score >= 10) return "critical";
  return "emergency";
}
