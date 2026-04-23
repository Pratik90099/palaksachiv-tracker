import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Project Categories
export function useProjectCategories() {
  return useQuery({
    queryKey: ["project_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProjectCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase.from("project_categories").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project_categories"] }); },
  });
}

// Project Tags
export function useProjectTags() {
  return useQuery({
    queryKey: ["project_tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProjectTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error } = await supabase.from("project_tags").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project_tags"] }); },
  });
}

// Districts
export function useDistricts() {
  return useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("districts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Departments
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Projects with their districts and departments
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_districts(district_id, districts(id, name, division)),
          project_departments(department_id, departments(id, name, short_name)),
          project_tag_assignments(tag_id, project_tags(id, name))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Tasks with districts and departments
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects(id, title, category),
          task_districts(district_id, districts(id, name, division)),
          task_departments(department_id, departments(id, name, short_name))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Visits
export function useVisits() {
  return useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select(`
          *,
          districts(id, name),
          guardian_secretaries(id, name, designation)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Guardian Secretaries
export function useGuardianSecretaries() {
  return useQuery({
    queryKey: ["guardian_secretaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_secretaries")
        .select(`*, districts(id, name)`)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Officers
export function useOfficers() {
  return useQuery({
    queryKey: ["officers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("officers")
        .select(`*, districts(id, name), departments(id, name, short_name)`)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      designation?: string;
      email?: string;
      role: string;
      district_id?: string | null;
      department_id?: string | null;
      is_active?: boolean;
      parichay_uid?: string | null;
      is_cso_admin?: boolean;
    }) => {
      const { data, error } = await supabase.from("officers").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
  });
}

export function useUpdateOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; [k: string]: any }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("officers").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
  });
}

export function useDeleteOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("officers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
  });
}

// Create Project
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      category: string;
      priority: string;
      status: string;
      is_goi_pending: boolean;
      is_critical: boolean;
      target_date?: string;
      assigned_officer_id?: string | null;
      district_ids: string[];
      department_ids: string[];
      tag_ids?: string[];
    }) => {
      const { district_ids, department_ids, tag_ids, ...projectData } = input;
      const { data: project, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();
      if (error) throw error;

      if (district_ids.length > 0) {
        const { error: dErr } = await supabase.from("project_districts").insert(
          district_ids.map((did) => ({ project_id: project.id, district_id: did }))
        );
        if (dErr) throw dErr;
      }

      if (department_ids.length > 0) {
        const { error: dpErr } = await supabase.from("project_departments").insert(
          department_ids.map((did) => ({ project_id: project.id, department_id: did }))
        );
        if (dpErr) throw dpErr;
      }

      if (tag_ids && tag_ids.length > 0) {
        const { error: tErr } = await supabase.from("project_tag_assignments").insert(
          tag_ids.map((tid) => ({ project_id: project.id, tag_id: tid }))
        );
        if (tErr) throw tErr;
      }

      return project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Update Project
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      status?: string;
      is_goi_pending?: boolean;
      is_critical?: boolean;
      target_date?: string;
      assigned_officer_id?: string | null;
      district_ids?: string[];
      department_ids?: string[];
      tag_ids?: string[];
    }) => {
      const { id, district_ids, department_ids, tag_ids, ...projectData } = input;
      const { error } = await supabase.from("projects").update(projectData).eq("id", id);
      if (error) throw error;

      if (district_ids !== undefined) {
        await supabase.from("project_districts").delete().eq("project_id", id);
        if (district_ids.length > 0) {
          const { error: dErr } = await supabase.from("project_districts").insert(
            district_ids.map((did) => ({ project_id: id, district_id: did }))
          );
          if (dErr) throw dErr;
        }
      }

      if (department_ids !== undefined) {
        await supabase.from("project_departments").delete().eq("project_id", id);
        if (department_ids.length > 0) {
          const { error: dpErr } = await supabase.from("project_departments").insert(
            department_ids.map((did) => ({ project_id: id, department_id: did }))
          );
          if (dpErr) throw dpErr;
        }
      }

      if (tag_ids !== undefined) {
        await supabase.from("project_tag_assignments").delete().eq("project_id", id);
        if (tag_ids.length > 0) {
          const { error: tErr } = await supabase.from("project_tag_assignments").insert(
            tag_ids.map((tid) => ({ project_id: id, tag_id: tid }))
          );
          if (tErr) throw tErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Create Task
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id?: string;
      title: string;
      description?: string;
      priority: string;
      status: string;
      responsible_officer?: string;
      agency?: string;
      target_date?: string;
      is_goi_pending: boolean;
      is_critical: boolean;
      assigned_officer_id?: string | null;
      district_ids: string[];
      department_ids: string[];
    }) => {
      const { district_ids, department_ids, ...taskData } = input;
      const { data: task, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();
      if (error) throw error;

      if (district_ids.length > 0) {
        await supabase.from("task_districts").insert(
          district_ids.map((did) => ({ task_id: task.id, district_id: did }))
        );
      }
      if (department_ids.length > 0) {
        await supabase.from("task_departments").insert(
          department_ids.map((did) => ({ task_id: task.id, department_id: did }))
        );
      }
      return task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Update Task
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      responsible_officer?: string;
      agency?: string;
      target_date?: string;
      is_goi_pending?: boolean;
      is_critical?: boolean;
      project_id?: string;
      assigned_officer_id?: string | null;
      district_ids?: string[];
      department_ids?: string[];
    }) => {
      const { id, district_ids, department_ids, ...taskData } = input;
      const { error } = await supabase.from("tasks").update(taskData).eq("id", id);
      if (error) throw error;

      if (district_ids !== undefined) {
        await supabase.from("task_districts").delete().eq("task_id", id);
        if (district_ids.length > 0) {
          await supabase.from("task_districts").insert(
            district_ids.map((did) => ({ task_id: id, district_id: did }))
          );
        }
      }
      if (department_ids !== undefined) {
        await supabase.from("task_departments").delete().eq("task_id", id);
        if (department_ids.length > 0) {
          await supabase.from("task_departments").insert(
            department_ids.map((did) => ({ task_id: id, department_id: did }))
          );
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Create Visit
export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      district_id: string;
      gs_id?: string;
      visit_date?: string;
      quarter: string;
      status: string;
      issues_logged?: number;
      rating?: string;
      observations?: string;
    }) => {
      const { data, error } = await supabase.from("visits").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

// Delete Project
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Delete Task
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
