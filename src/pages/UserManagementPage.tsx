import { useState } from "react";
import { Users, Shield, Search, Plus, Mail, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { USER_ROLES } from "@/lib/mock-data";

// Correct official data per provided lists
const MOCK_USERS = [
  // Chief Secretary
  { id: 1, name: "Shri. Rajesh Aggarwal, IAS", role: "Chief Secretary", district: "—", email: "cs@maharashtra.gov.in", status: "active" },
  // Secretaries (from official list)
  { id: 2, name: "Smt. Manisha Verma, IAS", role: "Department Secretary", district: "—", email: "acs.gad@maharashtra.gov.in", status: "active", dept: "Additional Chief Secretary" },
  { id: 3, name: "Shri. Milind Mhaiskar, IAS", role: "Department Secretary", district: "—", email: "acs.pwd@maharashtra.gov.in", status: "active", dept: "ACS, PWD" },
  { id: 4, name: "Shri. O P Gupta, IAS", role: "Guardian Secretary", district: "Pune", email: "acs.finance@maharashtra.gov.in", status: "active", dept: "ACS, Finance" },
  { id: 5, name: "Shri. Vikas Chandra Rastogi, IAS", role: "Department Secretary", district: "—", email: "acs.agriculture@maharashtra.gov.in", status: "active", dept: "ACS, Agriculture" },
  { id: 6, name: "Smt. Ashwini Bhide, IAS", role: "Department Secretary", district: "—", email: "acs.udd@maharashtra.gov.in", status: "active", dept: "ACS, UDD" },
  { id: 7, name: "Shri. Pravin Darade, IAS", role: "Department Secretary", district: "—", email: "ps.cooperation@maharashtra.gov.in", status: "active", dept: "PS, Co-Operation" },
  { id: 8, name: "Smt. Manisha Patankar-Mhaiskar, IAS", role: "Department Secretary", district: "—", email: "acs.home@maharashtra.gov.in", status: "active", dept: "ACS, Home" },
  { id: 9, name: "Shri. Sanjay Sethi, IAS", role: "Department Secretary", district: "—", email: "acs.transport@maharashtra.gov.in", status: "active", dept: "ACS, Transport & Ports" },
  { id: 10, name: "Shri. B. Venugopal Reddy, IAS", role: "Department Secretary", district: "—", email: "acs.higheredu@maharashtra.gov.in", status: "active", dept: "ACS, Higher & Technical Education" },
  { id: 11, name: "Smt. Abha Shukla, IAS", role: "Department Secretary", district: "—", email: "acs.energy@maharashtra.gov.in", status: "active", dept: "ACS, Energy" },
  { id: 12, name: "Shri. Anil Diggikar, IAS", role: "Department Secretary", district: "—", email: "acs.food@maharashtra.gov.in", status: "active", dept: "ACS, Food & Civil Supplies" },
  { id: 13, name: "Shri. Deepak Kapoor, IAS", role: "Department Secretary", district: "—", email: "acs.waterresources@maharashtra.gov.in", status: "active", dept: "ACS, Water Resources" },
  { id: 14, name: "Shri. Vikas Kharge, IAS", role: "Department Secretary", district: "—", email: "acs.revenue@maharashtra.gov.in", status: "active", dept: "ACS, Revenue" },
  { id: 15, name: "Shri. Ranjit Singh Deol, IAS", role: "Department Secretary", district: "—", email: "ps.schooledu@maharashtra.gov.in", status: "active", dept: "PS, School Education" },
  { id: 16, name: "Dr. Nipun Vinayak, IAS", role: "Department Secretary", district: "—", email: "ps.publichealth@maharashtra.gov.in", status: "active", dept: "PS, Public Health" },
  { id: 17, name: "Shri. Eknath Dawale, IAS", role: "Department Secretary", district: "—", email: "ps.ruraldev@maharashtra.gov.in", status: "active", dept: "PS, Rural Development" },
  { id: 18, name: "Shri. Parag Jain-Nainutia, IAS", role: "Department Secretary", district: "—", email: "ps.watersupply@maharashtra.gov.in", status: "active", dept: "PS, Water Supply & Sanitation" },
  // District Collectors (from official list)
  { id: 20, name: "Smt. Aanchal Goyal, IAS", role: "District Collector", district: "Mumbai City", email: "collector.mumbai@maharashtra.gov.in", status: "active" },
  { id: 21, name: "Shri. Saurabh Katiyar, IAS", role: "District Collector", district: "Mumbai Suburban", email: "collector.mumbaisuburban@maharashtra.gov.in", status: "active" },
  { id: 22, name: "Dr. Shrikrishnanath Panchal, IAS", role: "District Collector", district: "Thane", email: "collector.thane@maharashtra.gov.in", status: "active" },
  { id: 23, name: "Dr. Indurani Jakhar, IAS", role: "District Collector", district: "Palghar", email: "collector.palghar@maharashtra.gov.in", status: "active" },
  { id: 24, name: "Shri. Kishan Jawale, IAS", role: "District Collector", district: "Raigad", email: "collector.raigad@maharashtra.gov.in", status: "active" },
  { id: 25, name: "Shri. Manuj Jindal, IAS", role: "District Collector", district: "Ratnagiri", email: "collector.ratnagiri@maharashtra.gov.in", status: "active" },
  { id: 26, name: "Smt. Trupti Dhodmise, IAS", role: "District Collector", district: "Sindhudurg", email: "collector.sindhudurg@maharashtra.gov.in", status: "active" },
  { id: 27, name: "Shri. Jitendra Dudi, IAS", role: "District Collector", district: "Pune", email: "collector.pune@maharashtra.gov.in", status: "active" },
  { id: 28, name: "Shri. Santosh Patil, IAS", role: "District Collector", district: "Satara", email: "collector.satara@maharashtra.gov.in", status: "active" },
  { id: 29, name: "Shri. Ashok Kakade, IAS", role: "District Collector", district: "Sangli", email: "collector.sangli@maharashtra.gov.in", status: "active" },
  { id: 30, name: "Shri. Kumar Ashirwad, IAS", role: "District Collector", district: "Solapur", email: "collector.solapur@maharashtra.gov.in", status: "active" },
  { id: 31, name: "Shri. Amol Yedge, IAS", role: "District Collector", district: "Kolhapur", email: "collector.kolhapur@maharashtra.gov.in", status: "active" },
  { id: 32, name: "Shri. Ayush Prasad, IAS", role: "District Collector", district: "Nashik", email: "collector.nashik@maharashtra.gov.in", status: "active" },
  { id: 33, name: "Smt. Bhagyashree Vispute, IAS", role: "District Collector", district: "Dhule", email: "collector.dhule@maharashtra.gov.in", status: "active" },
  { id: 34, name: "Dr. Mittali Sethi, IAS", role: "District Collector", district: "Nandurbar", email: "collector.nandurbar@maharashtra.gov.in", status: "active" },
  { id: 35, name: "Shri. Rohan Ghuge, IAS", role: "District Collector", district: "Jalgaon", email: "collector.jalgaon@maharashtra.gov.in", status: "active" },
  { id: 36, name: "Dr. Pankaj Ashiya, IAS", role: "District Collector", district: "Ahilyanagar", email: "collector.ahmednagar@maharashtra.gov.in", status: "active" },
  { id: 37, name: "Shri. Deelip Swami, IAS", role: "District Collector", district: "Chhatrapati Sambhajinagar", email: "collector.aurangabad@maharashtra.gov.in", status: "active" },
  { id: 38, name: "Smt. Ashima Mittal, IAS", role: "District Collector", district: "Jalna", email: "collector.jalna@maharashtra.gov.in", status: "active" },
  { id: 39, name: "Shri. Rahul Gupta, IAS", role: "District Collector", district: "Hingoli", email: "collector.hingoli@maharashtra.gov.in", status: "active" },
  { id: 40, name: "Shri. Sanjay Chavan, IAS", role: "District Collector", district: "Parbhani", email: "collector.parbhani@maharashtra.gov.in", status: "active" },
  { id: 41, name: "Shri. Vivek Johnson, IAS", role: "District Collector", district: "Beed", email: "collector.beed@maharashtra.gov.in", status: "active" },
  { id: 42, name: "Smt. Varsha Thakur-Ghuge, IAS", role: "District Collector", district: "Latur", email: "collector.latur@maharashtra.gov.in", status: "active" },
  { id: 43, name: "Shri. Keerthi Kiran Pujar, IAS", role: "District Collector", district: "Dharashiv", email: "collector.dharashiv@maharashtra.gov.in", status: "active" },
  { id: 44, name: "Shri. Rahul Kardile, IAS", role: "District Collector", district: "Nanded", email: "collector.nanded@maharashtra.gov.in", status: "active" },
  { id: 45, name: "Dr. Vipin Itankar, IAS", role: "District Collector", district: "Nagpur", email: "collector.nagpur@maharashtra.gov.in", status: "active" },
  { id: 46, name: "Smt. Vanmathi C, IAS", role: "District Collector", district: "Wardha", email: "collector.wardha@maharashtra.gov.in", status: "active" },
  { id: 47, name: "Shri. Sawan Kumar, IAS", role: "District Collector", district: "Bhandara", email: "collector.bhandara@maharashtra.gov.in", status: "active" },
  { id: 48, name: "Shri. Prajit Nair, IAS", role: "District Collector", district: "Gondia", email: "collector.gondia@maharashtra.gov.in", status: "active" },
  { id: 49, name: "Shri. Vinay Gowda, IAS", role: "District Collector", district: "Chandrapur", email: "collector.chandrapur@maharashtra.gov.in", status: "active" },
  { id: 50, name: "Shri. Avishyant Panda, IAS", role: "District Collector", district: "Gadchiroli", email: "collector.gadchiroli@maharashtra.gov.in", status: "active" },
  { id: 51, name: "Shri. Ashish Yerekar, IAS", role: "District Collector", district: "Amravati", email: "collector.amravati@maharashtra.gov.in", status: "active" },
  { id: 52, name: "Smt. Varsha Meena, IAS", role: "District Collector", district: "Akola", email: "collector.akola@maharashtra.gov.in", status: "active" },
  { id: 53, name: "Shri. Yogesh Kumbhejkar, IAS", role: "District Collector", district: "Washim", email: "collector.washim@maharashtra.gov.in", status: "active" },
  { id: 54, name: "Dr. Kiran Patil, IAS", role: "District Collector", district: "Buldhana", email: "collector.buldhana@maharashtra.gov.in", status: "active" },
  { id: 55, name: "Shri. Vikas Meena, IAS", role: "District Collector", district: "Yavatmal", email: "collector.yavatmal@maharashtra.gov.in", status: "active" },
  // System Admin
  { id: 60, name: "NIC Admin Team", role: "System Administrator", district: "—", email: "admin@maharashtra.gov.in", status: "active" },
];

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter((u) => {
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase()) && !u.district.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const roleCounts = {
    "Chief Secretary": MOCK_USERS.filter(u => u.role === "Chief Secretary").length,
    "Department Secretary": MOCK_USERS.filter(u => u.role === "Department Secretary").length,
    "Guardian Secretary": MOCK_USERS.filter(u => u.role === "Guardian Secretary").length,
    "District Collector": MOCK_USERS.filter(u => u.role === "District Collector").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage portal users and role assignments</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="gov-card-elevated">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{role}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent h-7 text-sm focus-visible:ring-0"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px] text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Guardian Secretary">Guardian Secretary</SelectItem>
            <SelectItem value="Department Secretary">Department Secretary</SelectItem>
            <SelectItem value="District Collector">District Collector</SelectItem>
            <SelectItem value="Chief Secretary">Chief Secretary</SelectItem>
            <SelectItem value="System Administrator">System Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="gov-card-elevated overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gov-table-header">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">District</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="gov-badge bg-secondary text-foreground">
                      <Shield className="h-2.5 w-2.5" /> {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.district}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="gov-badge bg-gov-success-light text-gov-success">Active</span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          Showing {filtered.length} of {MOCK_USERS.length} users
        </div>
      </div>
    </div>
  );
}
