"use client";

import { useEffect, useState, useCallback } from "react";
import { useSettingsStore, type Setting } from "@/store/settings-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  Tag,
  Signal,
  CircleDot,
  AlertCircle,
  GripVertical,
} from "lucide-react";

// ─── Color options ──────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: "__none__", label: "Default", hex: "" },
  { value: "red", label: "Red", hex: "#ef4444" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "amber", label: "Amber", hex: "#f59e0b" },
  { value: "yellow", label: "Yellow", hex: "#eab308" },
  { value: "green", label: "Green", hex: "#22c55e" },
  { value: "emerald", label: "Emerald", hex: "#10b981" },
  { value: "teal", label: "Teal", hex: "#14b8a6" },
  { value: "cyan", label: "Cyan", hex: "#06b6d4" },
  { value: "blue", label: "Blue", hex: "#3b82f6" },
  { value: "indigo", label: "Indigo", hex: "#6366f1" },
  { value: "violet", label: "Violet", hex: "#8b5cf6" },
  { value: "purple", label: "Purple", hex: "#a855f7" },
  { value: "pink", label: "Pink", hex: "#ec4899" },
  { value: "rose", label: "Rose", hex: "#f43f5e" },
  { value: "gray", label: "Gray", hex: "#6b7280" },
];

function ColorBadge({ color }: { color: string }) {
  if (!color) return <Badge variant="outline">Default</Badge>;
  return (
    <Badge
      className={`border-transparent ${
        color === "red"
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          : color === "orange"
          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
          : color === "amber"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          : color === "yellow"
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          : color === "green"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : color === "emerald"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          : color === "teal"
          ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400"
          : color === "cyan"
          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400"
          : color === "blue"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          : color === "indigo"
          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
          : color === "violet"
          ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
          : color === "purple"
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
          : color === "pink"
          ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
          : color === "rose"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
          : color === "gray"
          ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </Badge>
  );
}

// ─── Form Dialog ────────────────────────────────────────────────────────────

interface SettingFormData {
  name: string;
  color: string;
  sortOrder: number;
}

const EMPTY_FORM: SettingFormData = { name: "", color: "", sortOrder: 0 };

function SettingFormDialog({
  open,
  onOpenChange,
  title,
  description,
  settingType,
  form,
  setForm,
  error,
  submitting,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  settingType: string;
  form: SettingFormData;
  setForm: React.Dispatch<React.SetStateAction<SettingFormData>>;
  error: string;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="setting-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="setting-name"
              placeholder={`Enter ${settingType} name`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <Select value={form.color || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, color: v === "__none__" ? "" : v }))}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-gray-200 dark:border-gray-600 shrink-0"
                        style={c.hex ? { backgroundColor: c.hex } : { backgroundColor: "var(--muted-foreground)" }}
                      />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setting-order" className="text-sm font-medium">Sort Order</Label>
            <Input
              id="setting-order"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Higher numbers appear first. For priorities, this determines urgency ranking.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="flex-1 sm:flex-none">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {title.includes("Edit") ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Table for a type ──────────────────────────────────────────────

function SettingsTable({
  type,
  typeLabel,
}: {
  type: "category" | "priority" | "status";
  typeLabel: string;
}) {
  const { settings, loading, fetchSettings, invalidate } = useSettingsStore();
  const items = settings.filter((s) => s.type === type).sort((a, b) => {
    if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
    return a.name.localeCompare(b.name);
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Setting | null>(null);
  const [form, setForm] = useState<SettingFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Helper ────────────────────────────────────────────────────────────────

  function getAuthHeaders(): Record<string, string> {
    // Auth token is now in httpOnly cookie — sent automatically by browser
    return {};
  }

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ type, name: form.name.trim(), color: form.color, sortOrder: form.sortOrder }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create");
        return;
      }
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      await fetchSettings();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    if (!selectedItem) return;
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/settings/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: form.name.trim(), color: form.color, sortOrder: form.sortOrder }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update");
        return;
      }
      setIsEditOpen(false);
      setSelectedItem(null);
      setForm(EMPTY_FORM);
      await fetchSettings();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/settings/${selectedItem.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      setIsDeleteOpen(false);
      setSelectedItem(null);
      await fetchSettings();
    } catch {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: Setting) => {
    setSelectedItem(item);
    setForm({ name: item.name, color: item.color || "__none__", sortOrder: item.sortOrder });
    setFormError("");
    setIsEditOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Manage available {typeLabel.toLowerCase()} options. {items.length} item{items.length !== 1 ? "s" : ""} configured.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
            setIsCreateOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Settings className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No {typeLabel.toLowerCase()} configured</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Click &quot;Add&quot; to create your first {type.toLowerCase()}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><ColorBadge color={item.color} /></TableCell>
                    <TableCell className="text-muted-foreground">{item.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "outline"} className={`text-xs ${item.isActive ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${item.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="font-medium text-sm">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <ColorBadge color={item.color} />
                      <span className="text-xs text-muted-foreground">Order: {item.sortOrder}</span>
                    </div>
                  </div>
                  <Badge variant={item.isActive ? "default" : "outline"} className={`text-xs shrink-0 ${item.isActive ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <SettingFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title={`Add ${typeLabel}`}
        description={`Create a new ${type.toLowerCase()} option`}
        settingType={type}
        form={form}
        setForm={setForm}
        error={formError}
        submitting={submitting}
        onSubmit={handleCreate}
        onCancel={() => { setIsCreateOpen(false); setForm(EMPTY_FORM); setFormError(""); }}
      />

      {/* Edit Dialog */}
      <SettingFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Edit ${typeLabel}`}
        description={`Update "${selectedItem?.name}"`}
        settingType={type}
        form={form}
        setForm={setForm}
        error={formError}
        submitting={submitting}
        onSubmit={handleEdit}
        onCancel={() => { setIsEditOpen(false); setSelectedItem(null); setForm(EMPTY_FORM); setFormError(""); }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {typeLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{selectedItem?.name}&quot;</strong>?
              {type === "priority" && " Tasks using this priority will keep their current value."}
              {type === "status" && " Tasks using this status will keep their current value."}
              {type === "category" && " Tasks using this category will keep their current value."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Settings View ─────────────────────────────────────────────────────

export function SettingsView() {
  const { user } = useAuthStore();
  const { fetchSettings, initialized, loading } = useSettingsStore();

  useEffect(() => {
    if (!initialized) {
      fetchSettings();
    }
  }, [initialized, fetchSettings]);

  // Seed default settings on first load
  useEffect(() => {
    if (user?.role === "admin" && initialized) {
      fetch("/api/settings/seed", { method: "POST" }).catch(() => {});
    }
  }, [user?.role, initialized]);

  const categories = useSettingsStore((s) => s.categories);
  const priorities = useSettingsStore((s) => s.priorities);
  const statuses = useSettingsStore((s) => s.statuses);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">System Settings</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Manage categories, priorities, statuses and other task options
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{categories.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Signal className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{priorities.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Priorities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CircleDot className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{statuses.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Statuses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
          {loading && !initialized ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="category">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="category" className="text-xs sm:text-sm">
                  <Tag className="h-4 w-4 mr-1.5 hidden sm:inline-flex" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="priority" className="text-xs sm:text-sm">
                  <Signal className="h-4 w-4 mr-1.5 hidden sm:inline-flex" />
                  Priorities
                </TabsTrigger>
                <TabsTrigger value="status" className="text-xs sm:text-sm">
                  <CircleDot className="h-4 w-4 mr-1.5 hidden sm:inline-flex" />
                  Statuses
                </TabsTrigger>
              </TabsList>
              <TabsContent value="category">
                <SettingsTable type="category" typeLabel="Category" />
              </TabsContent>
              <TabsContent value="priority">
                <SettingsTable type="priority" typeLabel="Priority" />
              </TabsContent>
              <TabsContent value="status">
                <SettingsTable type="status" typeLabel="Status" />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
