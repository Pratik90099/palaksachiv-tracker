// Mock data for the Guardian Secretary District Monitoring Portal

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

export const USER_ROLES: { value: UserRole; label: string; count: number }[] = [
  { value: "guardian_secretary", label: "Guardian Secretary", count: 36 },
  { value: "department_secretary", label: "Department Secretary", count: 45 },
  { value: "district_collector", label: "District Collector", count: 36 },
  { value: "divisional_commissioner", label: "Divisional Commissioner", count: 6 },
  { value: "chief_secretary", label: "Chief Secretary", count: 1 },
  { value: "cmo", label: "Chief Minister's Office", count: 5 },
  { value: "system_admin", label: "Chief Secretary Office", count: 2 },
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

export interface MockActionable {
  id: string;
  district: string;
  quarter: string;
  category: string;
  description: string;
  priority: Priority;
  agency: string;
  responsibleOfficer: string;
  targetDate: string;
  status: ActionableStatus;
  createdDate: string;
  isGOIPending: boolean;
  isCritical: boolean;
}

export const MOCK_ACTIONABLES: MockActionable[] = [
  {
    id: "ACT-2025-001",
    district: "Gadchiroli",
    quarter: "Q4 2024-25",
    category: "Land Acquisition",
    description: "Land acquisition pending for NH-30 bypass — 12 plots unresolved for 18 months",
    priority: "high",
    agency: "Revenue + Collector, Gadchiroli",
    responsibleOfficer: "Shri. R. K. Sharma, Revenue Secretary",
    targetDate: "2025-03-31",
    status: "at_risk",
    createdDate: "2025-01-15",
    isGOIPending: false,
    isCritical: false,
  },
  {
    id: "ACT-2025-002",
    district: "Gadchiroli",
    quarter: "Q4 2024-25",
    category: "Infrastructure",
    description: "Road: Gadchiroli–Chamorshi in poor condition — potholes, 2 accidents reported",
    priority: "high",
    agency: "PWD Secretary",
    responsibleOfficer: "Shri. M. P. Deshmukh, PWD Secretary",
    targetDate: "2025-02-28",
    status: "overdue",
    createdDate: "2025-01-15",
    isGOIPending: false,
    isCritical: false,
  },
  {
    id: "ACT-2025-003",
    district: "Gadchiroli",
    quarter: "Q4 2024-25",
    category: "Scheme Implementation",
    description: "PM Awas Yojana — 480 beneficiary verifications pending",
    priority: "medium",
    agency: "Rural Dev. Dept. + Collector",
    responsibleOfficer: "Smt. A. S. Patil, Rural Dev. Secretary",
    targetDate: "2025-03-15",
    status: "in_progress",
    createdDate: "2025-01-15",
    isGOIPending: false,
    isCritical: false,
  },
  {
    id: "ACT-2025-004",
    district: "Gadchiroli",
    quarter: "Q4 2024-25",
    category: "Pragati",
    description: "AMRUT 2.0 water pipeline — contractor stalled at 40% completion",
    priority: "critical",
    agency: "UDD + Municipal Council CEO",
    responsibleOfficer: "Shri. V. K. Joshi, UDD Secretary",
    targetDate: "2025-02-15",
    status: "escalated",
    createdDate: "2025-01-15",
    isGOIPending: true,
    isCritical: true,
  },
  {
    id: "ACT-2025-005",
    district: "Pune",
    quarter: "Q4 2024-25",
    category: "Infrastructure",
    description: "Metro Phase 2 land acquisition — 8 plots pending NOC from Forest Department",
    priority: "high",
    agency: "Revenue + Forest Department",
    responsibleOfficer: "Shri. K. L. Mehta, Revenue Secretary",
    targetDate: "2025-03-20",
    status: "in_progress",
    createdDate: "2025-01-20",
    isGOIPending: true,
    isCritical: false,
  },
  {
    id: "ACT-2025-006",
    district: "Nashik",
    quarter: "Q4 2024-25",
    category: "Public Health",
    description: "PHC upgrade at Trimbakeshwar — construction stalled due to contractor dispute",
    priority: "medium",
    agency: "Health Department",
    responsibleOfficer: "Dr. S. N. Kulkarni, Health Secretary",
    targetDate: "2025-03-30",
    status: "on_track",
    createdDate: "2025-01-10",
    isGOIPending: false,
    isCritical: false,
  },
  {
    id: "ACT-2025-007",
    district: "Nagpur",
    quarter: "Q3 2024-25",
    category: "Infrastructure",
    description: "Nagpur-Mumbai Expressway section — ROB construction delayed by 6 months",
    priority: "critical",
    agency: "PWD + NHAI",
    responsibleOfficer: "Shri. M. P. Deshmukh, PWD Secretary",
    targetDate: "2024-12-31",
    status: "overdue",
    createdDate: "2024-10-05",
    isGOIPending: true,
    isCritical: true,
  },
  {
    id: "ACT-2025-008",
    district: "Thane",
    quarter: "Q4 2024-25",
    category: "Urban",
    description: "Smart City project — integrated traffic management system installation pending",
    priority: "medium",
    agency: "UDD + Smart City SPV",
    responsibleOfficer: "Shri. V. K. Joshi, UDD Secretary",
    targetDate: "2025-03-25",
    status: "on_track",
    createdDate: "2025-01-08",
    isGOIPending: false,
    isCritical: false,
  },
  {
    id: "ACT-2025-009",
    district: "Aurangabad",
    quarter: "Q4 2024-25",
    category: "GOI Pending",
    description: "Jal Jeevan Mission — ₹240 Cr fund release pending from MoJS",
    priority: "high",
    agency: "Water Resources + GOI MoJS",
    responsibleOfficer: "Shri. P. R. Jadhav, Water Resources Secretary",
    targetDate: "2025-02-28",
    status: "overdue",
    createdDate: "2025-01-12",
    isGOIPending: true,
    isCritical: false,
  },
  {
    id: "ACT-2025-010",
    district: "Kolhapur",
    quarter: "Q4 2024-25",
    category: "Scheme Implementation",
    description: "MahaDBT — 1,200 farmer subsidy applications stuck in verification queue",
    priority: "medium",
    agency: "Agriculture Department + Collector",
    responsibleOfficer: "Shri. D. M. Bhosale, Agriculture Secretary",
    targetDate: "2025-03-10",
    status: "in_progress",
    createdDate: "2025-01-18",
    isGOIPending: false,
    isCritical: false,
  },
];

export interface MockVisit {
  id: string;
  gsName: string;
  district: string;
  visitDate: string;
  quarter: string;
  status: "completed" | "scheduled" | "missed";
  issuesLogged: number;
  rating: "satisfactory" | "needs_improvement" | "critical_attention";
}

export const MOCK_VISITS: MockVisit[] = [
  { id: "V-001", gsName: "Shri. A. K. Verma, IAS", district: "Pune", visitDate: "2025-01-22", quarter: "Q4 2024-25", status: "completed", issuesLogged: 5, rating: "satisfactory" },
  { id: "V-002", gsName: "Smt. P. L. Desai, IAS", district: "Nagpur", visitDate: "2025-01-18", quarter: "Q4 2024-25", status: "completed", issuesLogged: 8, rating: "needs_improvement" },
  { id: "V-003", gsName: "Shri. R. S. Patil, IAS", district: "Nashik", visitDate: "2025-02-05", quarter: "Q4 2024-25", status: "completed", issuesLogged: 4, rating: "satisfactory" },
  { id: "V-004", gsName: "Shri. M. K. Singh, IAS", district: "Aurangabad", visitDate: "2025-02-15", quarter: "Q4 2024-25", status: "scheduled", issuesLogged: 0, rating: "satisfactory" },
  { id: "V-005", gsName: "Smt. S. J. Kulkarni, IAS", district: "Gadchiroli", visitDate: "2025-01-15", quarter: "Q4 2024-25", status: "completed", issuesLogged: 6, rating: "critical_attention" },
  { id: "V-006", gsName: "Shri. D. N. Sharma, IAS", district: "Thane", visitDate: "", quarter: "Q4 2024-25", status: "missed", issuesLogged: 0, rating: "satisfactory" },
];

export interface DistrictHeatData {
  district: string;
  score: number;
  level: "high_performing" | "performing" | "moderate" | "needs_attention" | "critical" | "emergency";
  openActionables: number;
  overdueItems: number;
  visitCompleted: boolean;
  criticalIssues: number;
}

export const MOCK_HEAT_DATA: DistrictHeatData[] = MAHARASHTRA_DISTRICTS.map((district) => {
  const score = Math.floor(Math.random() * 100);
  const level = score >= 90 ? "high_performing" : score >= 75 ? "performing" : score >= 50 ? "moderate" : score >= 25 ? "needs_attention" : score >= 10 ? "critical" : "emergency";
  return {
    district,
    score,
    level,
    openActionables: Math.floor(Math.random() * 15) + 1,
    overdueItems: Math.floor(Math.random() * 5),
    visitCompleted: Math.random() > 0.2,
    criticalIssues: Math.floor(Math.random() * 3),
  };
});

export const DASHBOARD_STATS = {
  totalActionables: 342,
  openItems: 198,
  overdueItems: 47,
  criticalItems: 12,
  visitsCompleted: 28,
  visitsPending: 8,
  complianceRate: 78,
  goiPendingItems: 34,
  avgResolutionDays: 42,
  departmentsTracked: 16,
  totalDistricts: 36,
  escalatedItems: 15,
};

export const QUARTERLY_DATA = [
  { quarter: "Q1 2024-25", raised: 95, resolved: 72, overdue: 12, critical: 3 },
  { quarter: "Q2 2024-25", raised: 88, resolved: 68, overdue: 15, critical: 5 },
  { quarter: "Q3 2024-25", raised: 102, resolved: 81, overdue: 11, critical: 4 },
  { quarter: "Q4 2024-25", raised: 57, resolved: 22, overdue: 9, critical: 3 },
];

export const DEPARTMENT_PERFORMANCE = [
  { department: "PWD", score: 82, open: 24, overdue: 3, resolved: 45 },
  { department: "Revenue", score: 68, open: 18, overdue: 7, resolved: 32 },
  { department: "Health", score: 91, open: 12, overdue: 1, resolved: 38 },
  { department: "Education", score: 75, open: 15, overdue: 4, resolved: 29 },
  { department: "Agriculture", score: 71, open: 20, overdue: 5, resolved: 35 },
  { department: "UDD", score: 64, open: 22, overdue: 8, resolved: 28 },
  { department: "Rural Dev.", score: 88, open: 10, overdue: 2, resolved: 41 },
  { department: "Forest", score: 79, open: 8, overdue: 3, resolved: 22 },
];
