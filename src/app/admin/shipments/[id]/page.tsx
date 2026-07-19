"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle, Circle, MapPin, Truck, Package, AlertCircle, Trash2, Shield, User, MessageSquarePlus, Pencil, Save } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDate, SHIPMENT_STATUSES, STATUS_LABELS } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export const dynamic = "force-dynamic";

const STATUS_FLOW = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"];

const STATUS_ICONS: Record<string, any> = {
  created: Package,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  exception: AlertCircle,
};

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const [shipment, setShipment] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    location: "",
    description: "",
    branchId: "",
  });
  const [formError, setFormError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState("");
  const [commentLocation, setCommentLocation] = useState("");
  const [commentError, setCommentError] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isStaff = session?.user?.role === "STAFF" || isAdmin;

  const fetchShipment = useCallback(() => {
    setLoading(true);
    fetch(`/api/shipments/${id}`)
      .then((r) => r.json())
      .then((data) => setShipment(data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchShipment();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => setBranches(data));
  }, [fetchShipment]);

  const getAllowedNextStatuses = (currentStatus: string) => {
    if (!currentStatus) return [];
    // Admins can move a shipment to any other status, including reopening a delivered one
    if (isAdmin) return [...STATUS_FLOW, "exception"].filter((s) => s !== currentStatus);
    if (currentStatus === "delivered") return [];
    if (currentStatus === "exception") return ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"];
    const index = STATUS_FLOW.indexOf(currentStatus);
    const next = STATUS_FLOW.slice(index + 1);
    return [...next, "exception"];
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!updateForm.status) {
      setFormError("Please select a status");
      return;
    }

    const currentStatus = shipment?.status;
    const allowed = getAllowedNextStatuses(currentStatus);
    if (!allowed.includes(updateForm.status)) {
      setFormError(`Invalid transition: cannot move from "${STATUS_LABELS[currentStatus]}" to "${STATUS_LABELS[updateForm.status]}"`);
      return;
    }

    if (updateForm.status === currentStatus) {
      setFormError("Shipment is already in this status");
      return;
    }

    if (updateForm.status === "exception" && !updateForm.description.trim()) {
      setFormError("A reason is required when marking as exception");
      return;
    }

    setUpdating(true);
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to update status");
    } else {
      setUpdateForm({ status: "", location: "", description: "", branchId: "" });
    }
    setUpdating(false);
    fetchShipment();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError("");
    if (!comment.trim()) {
      setCommentError("Write a comment first");
      return;
    }
    setPostingComment(true);
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: comment.trim(), location: commentLocation.trim() || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setCommentError(data.error || "Failed to add comment");
    } else {
      setComment("");
      setCommentLocation("");
      fetchShipment();
    }
    setPostingComment(false);
  };

  const startEditing = () => {
    setEditForm({
      senderName: shipment.senderName || "",
      senderPhone: shipment.senderPhone || "",
      senderAddress: shipment.senderAddress || "",
      recipientName: shipment.recipientName || "",
      recipientPhone: shipment.recipientPhone || "",
      recipientAddress: shipment.recipientAddress || "",
      weight: shipment.weight ?? "",
      estimatedDelivery: shipment.estimatedDelivery ? shipment.estimatedDelivery.slice(0, 10) : "",
      originBranchId: shipment.originBranchId || "",
      destBranchId: shipment.destBranchId || "",
    });
    setEditError("");
    setEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setSavingEdit(true);
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error || "Failed to save changes");
    } else {
      setEditing(false);
      fetchShipment();
    }
    setSavingEdit(false);
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    if (!confirm("Remove this timeline entry? The customer will no longer see it.")) return;
    const res = await fetch(`/api/shipments/${id}/history/${entryId}`, { method: "DELETE" });
    if (res.ok) fetchShipment();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this shipment?")) return;
    const res = await fetch(`/api/shipments/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/shipments");
  };

  if (loading) {
    return (
      <AdminLayout active="Shipments">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  if (!shipment) {
    return (
      <AdminLayout active="Shipments">
        <p className="text-gray-500">Shipment not found.</p>
      </AdminLayout>
    );
  }

  const history = shipment.statusHistory || [];
  const allowedNextStatuses = getAllowedNextStatuses(shipment.status);
  const isDelivered = shipment.status === "delivered";

  return (
    <AdminLayout active="Shipments">
      <Link href="/admin/shipments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to Shipments
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shipment.trackingNumber}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge status={shipment.status} />
            {isDelivered && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Shipment Details</h2>
              {isAdmin && !editing && (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="mr-2 inline h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
            {editing && editForm ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {editError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Sender Name *</Label>
                    <Input required value={editForm.senderName} onChange={(e) => setEditForm({ ...editForm, senderName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Recipient Name *</Label>
                    <Input required value={editForm.recipientName} onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Sender Phone</Label>
                    <Input value={editForm.senderPhone} onChange={(e) => setEditForm({ ...editForm, senderPhone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Recipient Phone</Label>
                    <Input value={editForm.recipientPhone} onChange={(e) => setEditForm({ ...editForm, recipientPhone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Sender Address</Label>
                    <Input value={editForm.senderAddress} onChange={(e) => setEditForm({ ...editForm, senderAddress: e.target.value })} />
                  </div>
                  <div>
                    <Label>Recipient Address</Label>
                    <Input value={editForm.recipientAddress} onChange={(e) => setEditForm({ ...editForm, recipientAddress: e.target.value })} />
                  </div>
                  <div>
                    <Label>Origin Branch</Label>
                    <Select value={editForm.originBranchId} onChange={(e) => setEditForm({ ...editForm, originBranchId: e.target.value })}>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Destination Branch</Label>
                    <Select value={editForm.destBranchId} onChange={(e) => setEditForm({ ...editForm, destBranchId: e.target.value })}>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" min="0" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
                  </div>
                  <div>
                    <Label>Est. Delivery Date</Label>
                    <Input type="date" value={editForm.estimatedDelivery} onChange={(e) => setEditForm({ ...editForm, estimatedDelivery: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={savingEdit}>
                    <Save className="mr-2 inline h-4 w-4" />
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Sender</p><p className="font-medium">{shipment.senderName}</p></div>
              <div><p className="text-gray-400">Recipient</p><p className="font-medium">{shipment.recipientName}</p></div>
              <div><p className="text-gray-400">Sender Phone</p><p className="font-medium">{shipment.senderPhone || "—"}</p></div>
              <div><p className="text-gray-400">Recipient Phone</p><p className="font-medium">{shipment.recipientPhone || "—"}</p></div>
              <div><p className="text-gray-400">Origin Branch</p><p className="font-medium">{shipment.originBranch?.name}</p></div>
              <div><p className="text-gray-400">Destination Branch</p><p className="font-medium">{shipment.destBranch?.name}</p></div>
              <div><p className="text-gray-400">Weight</p><p className="font-medium">{shipment.weight ? `${shipment.weight}kg` : "—"}</p></div>
              <div><p className="text-gray-400">Est. Delivery</p><p className="font-medium">{formatDate(shipment.estimatedDelivery)}</p></div>
              <div><p className="text-gray-400">Created</p><p className="font-medium">{formatDate(shipment.createdAt)}</p></div>
              <div><p className="text-gray-400">Sender Address</p><p className="font-medium">{shipment.senderAddress || "—"}</p></div>
              <div><p className="text-gray-400">Recipient Address</p><p className="font-medium">{shipment.recipientAddress || "—"}</p></div>
              {shipment.sender?.email && (
                <div className="col-span-2">
                  <p className="text-gray-400">Registered Customer</p>
                  <p className="font-medium">
                    <Link href={`/admin/customers/${shipment.sender.id}`} className="text-brand-600 hover:underline">
                      {shipment.sender.name}
                    </Link>{" "}
                    ({shipment.sender.email})
                  </p>
                </div>
              )}
            </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Status Timeline</h2>
            {history.length === 0 ? (
              <p className="text-gray-500">No status updates yet.</p>
            ) : (
              <div className="space-y-0">
                {history.map((entry: any, idx: number) => {
                  const Icon = STATUS_ICONS[entry.status] || Circle;
                  const isLast = idx === history.length - 1;
                  return (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLast ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-gray-200" style={{ minHeight: "2rem" }} />}
                      </div>
                      <div className={`group flex-1 ${isLast ? "" : "pb-6"}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{STATUS_LABELS[entry.status] || entry.status}</span>
                          <Badge status={entry.status} />
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryEntry(entry.id)}
                              className="ml-auto rounded p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              title="Remove this timeline entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {entry.location && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />{entry.location}
                          </p>
                        )}
                        {entry.branch?.name && (
                          <p className="mt-1 text-sm text-gray-500">Branch: {entry.branch.name}</p>
                        )}
                        {entry.description && <p className="mt-1 text-sm text-gray-600">{entry.description}</p>}
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(entry.timestamp)}
                          {entry.updatedBy && (
                            <span className="ml-1 inline-flex items-center gap-1">
                              <User className="inline h-3 w-3" />
                              by {entry.updatedBy.name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Update Status</h2>
            {isDelivered && !isAdmin ? (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Shipment delivered
                </div>
                <p>This shipment has been delivered. No further status updates are allowed.</p>
              </div>
            ) : isStaff ? (
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                {formError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
                )}
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge status={shipment.status} />
                    <span className="text-sm text-gray-500">{STATUS_LABELS[shipment.status]}</span>
                  </div>
                </div>
                <div>
                  <Label>Next Status *</Label>
                  <Select
                    required
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    <option value="">— Select next status —</option>
                    {allowedNextStatuses.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    Allowed transitions: {allowedNextStatuses.map((s) => STATUS_LABELS[s]).join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={updateForm.location}
                    onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                    placeholder="e.g. London Hub"
                  />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select
                    value={updateForm.branchId}
                    onChange={(e) => setUpdateForm({ ...updateForm, branchId: e.target.value })}
                  >
                    <option value="">— Select branch —</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Description / Notes</Label>
                  <Textarea
                    value={updateForm.description}
                    onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                    placeholder={updateForm.status === "exception" ? "Reason for exception is required..." : "Additional details..."}
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? "Updating..." : "Update Status"}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4" />
                  Staff access required
                </div>
                <p>You do not have permission to update shipment status.</p>
              </div>
            )}
          </Card>

          {isStaff && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquarePlus className="h-5 w-5 text-gray-400" />
                Add Comment
              </h2>
              <p className="mb-4 text-xs text-gray-500">
                Posts an update to the tracking timeline without changing the status. Visible to the customer.
              </p>
              <form onSubmit={handleAddComment} className="space-y-4">
                {commentError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{commentError}</div>
                )}
                <div>
                  <Label>Comment *</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Package held at customs, awaiting clearance..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Location (optional)</Label>
                  <Input
                    value={commentLocation}
                    onChange={(e) => setCommentLocation(e.target.value)}
                    placeholder="e.g. Heathrow Cargo Terminal"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={postingComment} className="w-full">
                  {postingComment ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
