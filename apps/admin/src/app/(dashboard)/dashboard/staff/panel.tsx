"use client";

import { useMemo, useState } from "react";
import { ADMIN_PERMISSION_GROUPS } from "@baby-shop/shared/src/constants/admin-permissions";
import type { AdminPermission } from "@baby-shop/shared/src/constants/admin-permissions";
import { Check, Loader2, Plus, Shield, ShieldCheck, UserCog, X } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/api/endpoints";

type StaffRole = "ADMIN" | "SUPER_ADMIN";

export function StaffPanel({ initialStaff, canManage, currentUserId }: { initialStaff: AdminUser[]; canManage: boolean; currentUserId: string }) {
  const [staff, setStaff] = useState(initialStaff);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newPermissions, setNewPermissions] = useState<AdminPermission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);
  const [editRole, setEditRole] = useState<StaffRole>("ADMIN");

  const editingMember = useMemo(() => staff.find((member) => member._id === editingId), [staff, editingId]);

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPermissions.length) { setError("Choose at least one permission before creating an admin."); return; }
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      const { user } = await adminApi.createStaff({
        firstName: String(values.get("firstName")), lastName: String(values.get("lastName")),
        email: String(values.get("email")), password: String(values.get("password")), permissions: newPermissions,
      });
      setStaff((current) => [user, ...current]); setNewPermissions([]); form.reset();
      setNotice(`Admin account created for ${user.email}. Share the temporary password securely.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the admin account.");
    } finally { setBusy(false); }
  }

  function beginEdit(member: AdminUser) {
    setEditingId(member._id); setEditPermissions(member.permissions ?? []); setEditRole(member.role as StaffRole); setError(""); setNotice("");
  }

  async function saveAccess() {
    if (!editingMember) return;
    if (editRole === "ADMIN" && !editPermissions.length) { setError("An admin must have at least one permission. Choose Super Admin for full access."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { user } = await adminApi.updateStaffAccess(editingMember._id, { role: editRole, permissions: editPermissions });
      setStaff((current) => current.map((item) => item._id === user._id ? user : item));
      setEditingId(null); setNotice(`Access updated for ${user.firstName} ${user.lastName}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update admin access.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

    {canManage && <form onSubmit={createStaff} className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-cream-200 p-5 sm:p-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Plus className="h-5 w-5" /></div>
        <div><h2 className="font-semibold text-ink-900">Create an admin account</h2><p className="mt-1 text-sm text-ink-500">Assign access now. You can change permissions later.</p></div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <Field name="firstName" label="First name" placeholder="First name" />
        <Field name="lastName" label="Last name" placeholder="Last name" />
        <Field name="email" label="Work email" type="email" placeholder="name@babycentre.co.ke" />
        <Field name="password" label="Temporary password" type="password" placeholder="At least 10 characters" minLength={10} />
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-semibold text-ink-800">Permissions</h3><p className="mt-0.5 text-xs text-ink-500">Manage permissions also include view access.</p></div><span className="text-xs font-semibold text-blue-700">{newPermissions.length} selected</span></div>
        <PermissionGrid selected={newPermissions} onChange={setNewPermissions} />
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-cream-100 pt-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-ink-500">The new admin will sign in with their email and temporary password.</p><button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}{busy ? "Creating admin…" : "Create admin"}</button></div>
      </div>
    </form>}

    <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-5 py-4"><div><h2 className="font-semibold text-ink-900">Team access</h2><p className="mt-0.5 text-xs text-ink-500">{staff.length} administrator{staff.length === 1 ? "" : "s"} in this workspace</p></div><div className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-3 py-1.5 text-xs font-medium text-ink-600"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Permissions enforced by the API</div></div>
      <div className="divide-y divide-cream-100">
        {staff.map((person) => <div key={person._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${person.role === "SUPER_ADMIN" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>{person.firstName?.charAt(0)?.toUpperCase() ?? "A"}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{person.firstName} {person.lastName}{person._id === currentUserId && <span className="ml-2 text-xs font-normal text-ink-400">You</span>}</p><p className="truncate text-xs text-ink-500">{person.email}</p></div></div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end"><RoleBadge role={person.role as StaffRole} /><span className="rounded-full bg-cream-50 px-2.5 py-1 text-xs text-ink-600">{person.role === "SUPER_ADMIN" ? "All permissions" : `${person.permissions?.length ?? 0} permissions`}</span><span className="mr-1 text-xs text-ink-400">Joined {new Date(person.createdAt).toLocaleDateString()}</span>{canManage && person._id !== currentUserId && <button type="button" onClick={() => beginEdit(person)} className="h-9 rounded-lg border border-cream-300 px-3 text-xs font-semibold text-ink-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">Manage access</button>}</div>
        </div>)}
        {!staff.length && <div className="px-5 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-50 text-ink-400"><UserCog className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-ink-800">No admin accounts yet</p><p className="mt-1 text-xs text-ink-500">Create an admin and assign the store sections they need.</p></div>}
      </div>
      {!canManage && <p className="border-t border-cream-200 bg-cream-50/70 px-5 py-3 text-xs text-ink-500">Only a Super Admin can create administrators or change their access.</p>}
    </section>

    {editingMember && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditingId(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="access-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cream-200 bg-white/95 p-5 backdrop-blur sm:p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Staff access</p><h2 id="access-title" className="mt-1 text-lg font-semibold text-ink-900">{editingMember.firstName} {editingMember.lastName}</h2><p className="mt-1 text-sm text-ink-500">Choose their role and the areas they can access.</p></div><button type="button" aria-label="Close" onClick={() => setEditingId(null)} className="grid h-9 w-9 place-items-center rounded-xl text-ink-400 hover:bg-cream-50 hover:text-ink-800"><X className="h-4 w-4" /></button></div>
        <div className="space-y-5 p-5 sm:p-6"><label className="block max-w-xs space-y-2 text-sm font-semibold text-ink-700">Role<select value={editRole} onChange={(event) => setEditRole(event.target.value as StaffRole)} className="h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="ADMIN">Admin · assigned permissions</option><option value="SUPER_ADMIN">Super Admin · full access</option></select></label>
          {editRole === "SUPER_ADMIN" ? <div className="flex gap-3 rounded-2xl border border-pink-100 bg-pink-50/70 p-4 text-sm text-pink-950"><Shield className="mt-0.5 h-5 w-5 shrink-0 text-pink-700" /><p><strong>Full workspace access.</strong> Super Admins can manage all store areas and staff permissions.</p></div> : <PermissionGrid selected={editPermissions} onChange={setEditPermissions} />}
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-cream-200 bg-white p-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" disabled={busy} onClick={() => setEditingId(null)} className="h-10 rounded-xl px-4 text-sm font-semibold text-ink-600 hover:bg-cream-50">Cancel</button><button type="button" disabled={busy} onClick={saveAccess} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{busy ? "Saving…" : "Save access"}</button></div>
      </section>
    </div>}
  </div>;
}

function PermissionGrid({ selected, onChange }: { selected: AdminPermission[]; onChange: (permissions: AdminPermission[]) => void }) {
  const chosen = new Set(selected);
  function toggle(permission: AdminPermission) { onChange(chosen.has(permission) ? selected.filter((item) => item !== permission) : [...selected, permission]); }
  function toggleGroup(permissions: readonly { key: AdminPermission }[]) {
    const keys = permissions.map(({ key }) => key);
    const allChosen = keys.every((key) => chosen.has(key));
    onChange(allChosen ? selected.filter((permission) => !keys.includes(permission)) : Array.from(new Set([...selected, ...keys])));
  }
  return <div className="grid gap-3 sm:grid-cols-2">
    {ADMIN_PERMISSION_GROUPS.map((group) => {
      const groupKeys = group.permissions.map(({ key }) => key);
      const allChosen = groupKeys.every((key) => chosen.has(key));
      return <fieldset key={group.key} className="rounded-2xl border border-cream-200 p-4">
        <div className="mb-2.5 flex items-center justify-between gap-2"><legend className="text-sm font-semibold text-ink-800">{group.label}</legend><button type="button" onClick={() => toggleGroup(group.permissions)} className="text-[11px] font-semibold text-blue-700 hover:text-blue-900">{allChosen ? "Clear" : "Select all"}</button></div>
        <div className="space-y-2.5">{group.permissions.map(({ key, label }) => <label key={key} className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-ink-600"><input type="checkbox" checked={chosen.has(key)} onChange={() => toggle(key)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-blue-700 focus:ring-blue-500" /><span>{label}</span></label>)}</div>
      </fieldset>;
    })}
  </div>;
}

function Field({ name, label, placeholder, type = "text", minLength }: { name: string; label: string; placeholder: string; type?: string; minLength?: number }) {
  return <label className="block space-y-1.5 text-xs font-semibold text-ink-600">{label}<input name={name} type={type} placeholder={placeholder} required minLength={minLength} autoComplete={name === "password" ? "new-password" : name === "email" ? "email" : "off"} className="h-10 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm font-normal text-ink-900 outline-none placeholder:text-ink-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>;
}

function RoleBadge({ role }: { role: StaffRole }) {
  const isSuper = role === "SUPER_ADMIN";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${isSuper ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>{isSuper ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}{isSuper ? "SUPER ADMIN" : "ADMIN"}</span>;
}
