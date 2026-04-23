import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDistricts, useDepartments, useCreateOfficer, useUpdateOfficer } from "@/hooks/use-data";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "guardian_secretary", label: "Guardian Secretary" },
  { value: "department_secretary", label: "Department Secretary" },
  { value: "district_collector", label: "District Collector" },
  { value: "divisional_commissioner", label: "Divisional Commissioner" },
  { value: "chief_secretary", label: "Chief Secretary" },
  { value: "cmo", label: "CMO" },
  { value: "system_admin", label: "CS Office Staff" },
];

interface OfficerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editOfficer?: any;
}

export function OfficerFormDialog({ open, onOpenChange, editOfficer }: OfficerFormDialogProps) {
  const { data: districts } = useDistricts();
  const { data: departments } = useDepartments();
  const createOfficer = useCreateOfficer();
  const updateOfficer = useUpdateOfficer();

  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    role: "department_secretary",
    district_id: "",
    department_id: "",
    is_active: true,
    parichay_uid: "",
    is_cso_admin: false,
  });

  useEffect(() => {
    if (editOfficer) {
      setForm({
        name: editOfficer.name || "",
        designation: editOfficer.designation || "",
        email: editOfficer.email || "",
        role: editOfficer.role || "department_secretary",
        district_id: editOfficer.district_id || "",
        department_id: editOfficer.department_id || "",
        is_active: editOfficer.is_active ?? true,
        parichay_uid: editOfficer.parichay_uid || "",
        is_cso_admin: editOfficer.is_cso_admin ?? false,
      });
    } else {
      setForm({ name: "", designation: "", email: "", role: "department_secretary", district_id: "", department_id: "", is_active: true, parichay_uid: "", is_cso_admin: false });
    }
  }, [editOfficer, open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (form.name.length > 200) { toast.error("Name must be under 200 characters"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Invalid email"); return; }
    if (form.parichay_uid && form.parichay_uid.length > 100) { toast.error("Parichay UID must be under 100 characters"); return; }

    const payload = {
      name: form.name.trim(),
      designation: form.designation.trim() || undefined,
      email: form.email.trim().toLowerCase() || undefined,
      role: form.role,
      district_id: form.district_id || null,
      department_id: form.department_id || null,
      is_active: form.is_active,
      parichay_uid: form.parichay_uid.trim() || null,
      is_cso_admin: form.is_cso_admin,
    };

    try {
      if (editOfficer) {
        await updateOfficer.mutateAsync({ id: editOfficer.id, ...payload });
        toast.success("Officer updated");
      } else {
        await createOfficer.mutateAsync(payload);
        toast.success("Officer added");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save officer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{editOfficer ? "Edit Officer" : "Add Officer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shri. Name, IAS" maxLength={200} />
          </div>
          <div>
            <Label className="text-xs">Designation</Label>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="District Collector, Pune" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="officer@maharashtra.gov.in" />
          </div>
          <div>
            <Label className="text-xs">Role *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">District</Label>
              <Select value={form.district_id || "none"} onValueChange={(v) => setForm({ ...form, district_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Department</Label>
              <Select value={form.department_id || "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.short_name || d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Parichay UID (optional)</Label>
            <Input
              value={form.parichay_uid}
              onChange={(e) => setForm({ ...form, parichay_uid: e.target.value })}
              placeholder="Pre-map for SSO auto-login when Parichay goes live"
              maxLength={100}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              When entered, this officer will auto-login via Parichay SSO once production credentials are wired.
            </p>
          </div>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_cso_admin} onChange={(e) => setForm({ ...form, is_cso_admin: e.target.checked })} />
              Mark as CS Office Admin (full system access)
            </label>
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createOfficer.isPending || updateOfficer.isPending}>
              {editOfficer ? "Update" : "Add Officer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
