import { useAuth } from "@/lib/auth-context";
import { DIVISIONS } from "@/lib/mock-data";

/**
 * Returns filter functions based on the logged-in user's role.
 * - Department Secretary: filter by department name
 * - Guardian Secretary / District Collector: filter by district name
 * - Divisional Commissioner: filter by division (multiple districts)
 * - Chief Secretary / CMO / Admin: see everything
 */
export function useRoleFilter() {
  const { user } = useAuth();

  const role = user?.role;
  const userDept = user?.department;
  const userDistrict = user?.district;
  const userDivision = user?.division;

  // Get districts in this user's division
  const divisionDistricts: string[] = userDivision
    ? (DIVISIONS as Record<string, string[]>)[userDivision] || []
    : [];

  /** Filter tasks by role */
  function filterTasks<T extends Record<string, any>>(tasks: T[]): T[] {
    return tasks.filter((t) => {
      // Dept Secretary → by department
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

      // GS or DC → by district
      if ((role === "guardian_secretary" || role === "district_collector") && userDistrict) {
        const districtNames = t.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => d === userDistrict);
      }

      // DivCom → by division's districts
      if (role === "divisional_commissioner" && divisionDistricts.length > 0) {
        const districtNames = t.task_districts?.map((td: any) => td.districts?.name).filter(Boolean) || [];
        return districtNames.some((d: string) => divisionDistricts.includes(d));
      }

      return true; // CS, CMO, admin see all
    });
  }

  /** Filter projects by role */
  function filterProjects<T extends Record<string, any>>(projects: T[]): T[] {
    return projects.filter((p) => {
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

  /** Filter visits by role */
  function filterVisits<T extends Record<string, any>>(visits: T[]): T[] {
    return visits.filter((v) => {
      if ((role === "guardian_secretary" || role === "district_collector") && userDistrict) {
        return v.districts?.name === userDistrict;
      }
      if (role === "divisional_commissioner" && divisionDistricts.length > 0) {
        return divisionDistricts.includes(v.districts?.name);
      }
      // Dept sec doesn't filter visits (not district-specific)
      return true;
    });
  }

  return { filterTasks, filterProjects, filterVisits, role, userDept, userDistrict, userDivision, divisionDistricts };
}
