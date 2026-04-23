import { useAuth } from "@/lib/auth-context";
import { DIVISIONS } from "@/lib/mock-data";
import { useOfficers } from "@/hooks/use-data";

/**
 * Returns filter functions based on the logged-in user's role.
 * - Department Secretary: filter by department name
 * - Guardian Secretary / District Collector: filter by district name
 * - Divisional Commissioner: filter by division (multiple districts)
 * - Chief Secretary / CMO / Admin: see everything
 *
 * Additionally, items with `assigned_officer_id` matching the logged-in user
 * (matched by email against the officers directory) are always included.
 */
export function useRoleFilter() {
  const { user } = useAuth();
  const { data: officers } = useOfficers();

  const role = user?.role;
  const userDept = user?.department;
  const userDistrict = user?.district;
  const userDivision = user?.division;

  // Find the officer record matching the logged-in user (by email)
  const currentOfficerId = user?.email
    ? (officers || []).find((o: any) => (o.email || "").toLowerCase() === user.email.toLowerCase())?.id
    : undefined;

  const divisionDistricts: string[] = userDivision
    ? (DIVISIONS as Record<string, string[]>)[userDivision] || []
    : [];

  const isAssignedToMe = (item: any) =>
    currentOfficerId && item.assigned_officer_id === currentOfficerId;

  function filterTasks<T extends Record<string, any>>(tasks: T[]): T[] {
    return tasks.filter((t) => {
      if (isAssignedToMe(t)) return true;

      if (role === "department_secretary" && userDept) {
        const deptNames = t.task_departments?.map((td: any) => td.departments?.name).filter(Boolean) || [];
        const matchDept = deptNames.some((d: string) =>
          userDept.includes(d) || d.includes(userDept.split(" ")[0])
        );
        const matchAgency = t.agency && userDept.split(" ").some(
          (word: string) => word.length > 2 && t.agency.toLowerCase().includes(word.toLowerCase())
        );
        return matchDept || matchAgency;
      }

      if ((role === "guardian_secretary" || role === "district_collector") && userDistrict) {
        const districtNames = t.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => d === userDistrict);
      }

      if (role === "divisional_commissioner" && divisionDistricts.length > 0) {
        const districtNames = t.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => divisionDistricts.includes(d));
      }

      return true; // CS, CMO, admin see all
    });
  }

  function filterProjects<T extends Record<string, any>>(projects: T[]): T[] {
    return projects.filter((p) => {
      if (isAssignedToMe(p)) return true;

      if (role === "department_secretary" && userDept) {
        const deptNames = p.project_departments?.map((pd: any) => pd.departments?.name).filter(Boolean) || [];
        return deptNames.some((d: string) =>
          userDept.includes(d) || d.includes(userDept.split(" ")[0])
        );
      }

      if ((role === "guardian_secretary" || role === "district_collector") && userDistrict) {
        const districtNames = p.project_districts?.map((pd: any) => pd.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => d === userDistrict);
      }

      if (role === "divisional_commissioner" && divisionDistricts.length > 0) {
        const districtNames = p.project_districts?.map((pd: any) => pd.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => divisionDistricts.includes(d));
      }

      return true;
    });
  }

  function filterVisits<T extends Record<string, any>>(visits: T[]): T[] {
    return visits.filter((v) => {
      if ((role === "guardian_secretary" || role === "district_collector") && userDistrict) {
        return v.districts?.name === userDistrict;
      }
      if (role === "divisional_commissioner" && divisionDistricts.length > 0) {
        return divisionDistricts.includes(v.districts?.name);
      }
      return true;
    });
  }

  return {
    filterTasks,
    filterProjects,
    filterVisits,
    role,
    userDept,
    userDistrict,
    userDivision,
    divisionDistricts,
    currentOfficerId,
  };
}
