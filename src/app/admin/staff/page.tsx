"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserCog, Plus, Trash2, X, Shield } from "lucide-react";
import { Card, Button, Input, Label, Select, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminStaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "STAFF", staffRole: "STAFF" });

  const isSuperAdmin = session?.user?.staffRole === "SUPER_ADMIN";

  const fetchStaff = () => {
    setLoading(true);
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => setStaff(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", phone: "", password: "", role: "STAFF", staffRole: "STAFF" });
    setShowForm(false);
    fetchStaff();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
    fetchStaff();
  };

  const roleBadge = (role: string, staffRole: string) => {
    if (staffRole === "SUPER_ADMIN") return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"><Shield className="h-3 w-3" />Super Admin</span>;
    if (role === "ADMIN") return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Admin</span>;
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Staff</span>;
  };

  return (
    <AdminLayout active="Staff">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        {isSuperAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-4 w-4" />Close</> : <><Plus className="mr-2 h-4 w-4" />Add Staff</>}
          </Button>
        )}
      </div>

      {showForm && isSuperAdmin && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Staff Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Password *</Label>
              <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <div>
              <Label>Staff Role</Label>
              <Select value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create Staff Account</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : staff.length === 0 ? (
        <Card>
          <EmptyState message="No staff members yet." icon={<UserCog className="h-12 w-12" />} />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Role</Th>
              <Th>Created</Th>
              {isSuperAdmin && <Th>Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td className="font-medium text-gray-900">{s.name}</Td>
                <Td>{s.email}</Td>
                <Td>{s.phone || "—"}</Td>
                <Td>{roleBadge(s.role, s.staffRole)}</Td>
                <Td>{formatDate(s.createdAt)}</Td>
                {isSuperAdmin && (
                  <Td>
                    {s.id !== session?.user?.id && (
                      <button onClick={() => handleDelete(s.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  );
}
