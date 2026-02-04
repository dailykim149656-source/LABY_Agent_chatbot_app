"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Shield, ShieldOff, Trash2 } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useUserAuthLogs } from "@/hooks/use-user-auth-logs";
import { useAuth } from "@/lib/auth-context";
import { getUiText } from "@/lib/ui-text";
import { API_BASE_URL } from "@/lib/api";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UsersViewProps = {
  language: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function UsersView({ language }: UsersViewProps) {
  const uiText = getUiText(language);
  const { user: currentUser } = useAuth();
  const consentVersion = "2026-02-04";
  const {
    users,
    total,
    isLoading,
    error,
    createUser,
    updateUser,
    deactivateUser,
    deleteUserHard,
    resetUserPassword,
  } = useUsers();
  const {
    logsByUser,
    loadingByUser,
    errorByUser,
    loadLogs,
    clearLogs,
    clearAllLogs,
  } = useUserAuthLogs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isDownloadingLogs, setIsDownloadingLogs] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    affiliation: "",
    department: "",
    position: "",
    phone: "",
    contactEmail: "",
    role: "user" as UserRole,
  });

  const roleOptions = useMemo(
    () => [
      { value: "admin" as UserRole, label: uiText.usersRoleAdmin },
      { value: "user" as UserRole, label: uiText.usersRoleUser },
    ],
    [uiText]
  );
  const positionOptions = useMemo(
    () => [
      { value: "undergraduate", label: uiText.positionUndergraduate },
      { value: "masters", label: uiText.positionMasters },
      { value: "phd", label: uiText.positionPhd },
      { value: "postdoc", label: uiText.positionPostdoc },
      { value: "researcher", label: uiText.positionResearcher },
      { value: "professor", label: uiText.positionProfessor },
    ],
    [uiText]
  );
  const positionLabelMap = useMemo(
    () =>
      positionOptions.reduce<Record<string, string>>((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [positionOptions]
  );
  const formatPosition = (value?: string | null) =>
    value ? positionLabelMap[value] || value : "-";

  const resetForm = () => {
    setForm({
      email: "",
      name: "",
      password: "",
      affiliation: "",
      department: "",
      position: "",
      phone: "",
      contactEmail: "",
      role: "user",
    });
    setConsentChecked(false);
    setFormError(null);
  };

  const openResetDialog = (userId: number) => {
    setResetUserId(userId);
    setResetPassword("");
    setResetError(null);
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    if (!resetPassword.trim()) {
      setResetError(uiText.usersResetPasswordError);
      return;
    }
    try {
      await resetUserPassword(resetUserId, resetPassword.trim());
      setResetDialogOpen(false);
      setResetUserId(null);
      setResetPassword("");
      toast({
        title: uiText.usersResetPasswordSuccess,
      });
    } catch (err) {
      setResetError(err instanceof Error ? err.message : uiText.usersResetPasswordFailed);
    }
  };

  const handleCreate = async () => {
    if (
      !form.email.trim() ||
      !form.password.trim() ||
      !form.name.trim() ||
      !form.affiliation.trim() ||
      !form.department.trim() ||
      !form.position.trim() ||
      !consentChecked
    ) {
      setFormError(uiText.usersFormErrorRequired);
      return;
    }
    try {
      const phoneValue = form.phone.trim();
      const contactEmailValue = form.contactEmail.trim();
      await createUser({
        email: form.email.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        affiliation: form.affiliation.trim(),
        department: form.department.trim(),
        position: form.position.trim(),
        phone: phoneValue || undefined,
        contactEmail: contactEmailValue || undefined,
        role: form.role,
        consent: {
          version: consentVersion,
          required: true,
          phone: Boolean(phoneValue || contactEmailValue),
          iotEnvironment: true,
          iotReagent: true,
          voice: true,
          video: true,
          marketing: false,
        },
      });
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : uiText.loginError);
    }
  };

  const toggleRole = async (id: number, role: UserRole) => {
    const nextRole = role === "admin" ? "user" : "admin";
    await updateUser(id, { role: nextRole });
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    if (isActive) {
      await deactivateUser(id);
      return;
    }
    await updateUser(id, { isActive: true });
  };

  const handleDownloadAuthLogs = async () => {
    const url = `${API_BASE_URL}/api/export/auth-logs?limit=all`;
    setIsDownloadingLogs(true);
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "auth_logs_export.csv";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) {
          filename = match[1];
        }
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      window.location.href = url;
    } finally {
      setIsDownloadingLogs(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">{uiText.usersTitle}</h2>
          <p className="text-xs text-muted-foreground">
            {uiText.usersSubtitle.replace("{count}", String(total))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDownloadAuthLogs}
            disabled={isDownloadingLogs}
          >
            <Download className="size-4" />
            {isDownloadingLogs ? uiText.loading : uiText.usersAuthLogDownloadAll}
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                {uiText.usersAuthLogClearAll}
              </Button>
            }
            title={uiText.usersAuthLogClearAllTitle}
            description={uiText.usersAuthLogClearAllDescription}
            confirmText={uiText.usersAuthLogClearAllConfirm}
            cancelText={uiText.actionCancel}
            onConfirm={async () => {
              try {
                await clearAllLogs();
              } catch {
                window.alert(uiText.usersAuthLogClearAllFailed);
              }
            }}
            variant="destructive"
          />
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            {uiText.usersAddButton}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="text-sm text-muted-foreground">{uiText.loading}</div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {!isLoading && users.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{uiText.usersEmptyTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {uiText.usersEmptyDescription}
            </CardContent>
          </Card>
        )}

        {users.length > 0 && (
          <Table className="min-w-[1400px] text-sm lg:text-base">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{uiText.usersTableEmail}</TableHead>
                <TableHead>{uiText.usersTableName}</TableHead>
                <TableHead>{uiText.usersTableAffiliation}</TableHead>
                <TableHead>{uiText.usersTableDepartment}</TableHead>
                <TableHead>{uiText.usersTablePosition}</TableHead>
                <TableHead>{uiText.usersTablePhone}</TableHead>
                <TableHead>{uiText.usersTableContactEmail}</TableHead>
                <TableHead>{uiText.usersTableRole}</TableHead>
                <TableHead>{uiText.usersTableStatus}</TableHead>
                <TableHead>{uiText.usersTableCreatedAt}</TableHead>
                <TableHead>{uiText.usersTableLastLogin}</TableHead>
                <TableHead className="text-right">{uiText.usersTableActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => {
                const isSelf = currentUser?.id === item.id;
                const authLogs = logsByUser[item.id];
                const authLogsError = errorByUser[item.id];
                const authLogsLoading = loadingByUser[item.id];
                const rowAriaLabel = `${item.email} ${uiText.usersAuthLogTitle}`;
                return (
                  <Popover
                    key={item.id}
                    onOpenChange={(open) => {
                      if (
                        open &&
                        !authLogsLoading &&
                        (authLogs === undefined || authLogsError)
                      ) {
                        loadLogs(item.id, 10);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <TableRow
                        role="button"
                        tabIndex={0}
                        aria-label={rowAriaLabel}
                        className="cursor-pointer hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            (event.currentTarget as HTMLTableRowElement).click();
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          <span className="underline decoration-dotted">
                            {item.email}
                          </span>
                        </TableCell>
                        <TableCell>{item.name || "-"}</TableCell>
                    <TableCell>{item.affiliation || "-"}</TableCell>
                    <TableCell>{item.department || "-"}</TableCell>
                    <TableCell>{formatPosition(item.position)}</TableCell>
                    <TableCell>{item.phone || "-"}</TableCell>
                    <TableCell>{item.contactEmail || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.role === "admin" ? "default" : "secondary"}>
                        {item.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "secondary" : "outline"}>
                        {item.isActive
                          ? uiText.usersStatusActive
                          : uiText.usersStatusInactive}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{formatDate(item.lastLoginAt)}</TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRole(item.id, item.role)}
                          disabled={isSelf}
                        >
                          {item.role === "admin"
                            ? uiText.usersActionDemote
                            : uiText.usersActionPromote}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(item.id, item.isActive)}
                          disabled={isSelf}
                        >
                          {item.isActive ? (
                            <>
                              <ShieldOff className="mr-1 size-4" />
                              {uiText.usersActionDeactivate}
                            </>
                          ) : (
                            <>
                              <Shield className="mr-1 size-4" />
                              {uiText.usersActionActivate}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResetDialog(item.id)}
                        >
                          {uiText.usersActionResetPassword}
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="sm">
                              {uiText.usersAuthLogClear}
                            </Button>
                          }
                          title={uiText.usersAuthLogClearTitle}
                          description={uiText.usersAuthLogClearDescription}
                          confirmText={uiText.usersAuthLogClearConfirm}
                          cancelText={uiText.actionCancel}
                          onConfirm={async () => {
                            try {
                              await clearLogs(item.id);
                            } catch {
                              window.alert(uiText.usersAuthLogClearFailed);
                            }
                          }}
                          variant="destructive"
                        />
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isSelf}
                            >
                              <Trash2 className="mr-1 size-4" />
                              {uiText.usersActionHardDelete}
                            </Button>
                          }
                          title={uiText.usersHardDeleteTitle}
                          description={uiText.usersHardDeleteDescription}
                          confirmText={uiText.usersHardDeleteConfirm}
                          cancelText={uiText.actionCancel}
                          onConfirm={async () => {
                            try {
                              await deleteUserHard(item.id);
                            } catch {
                              window.alert(uiText.usersHardDeleteFailed);
                            }
                          }}
                          variant="destructive"
                        />
                      </div>
                    </TableCell>
                      </TableRow>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px]">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">
                          {uiText.usersAuthLogTitle}
                        </div>
                        {(authLogsLoading || authLogs === undefined) && (
                          <div className="text-xs text-muted-foreground">
                            {uiText.loading}
                          </div>
                        )}
                        {authLogsError && (
                          <div className="text-xs text-red-500">
                            {authLogsError}
                          </div>
                        )}
                        {!authLogsLoading &&
                          !authLogsError &&
                          authLogs !== undefined &&
                          authLogs.length === 0 && (
                            <div className="text-xs text-muted-foreground">
                              {uiText.usersAuthLogEmpty}
                            </div>
                          )}
                        {!authLogsLoading &&
                          !authLogsError &&
                          authLogs &&
                          authLogs.length > 0 && (
                            <div className="space-y-3">
                              {authLogs.map((log) => (
                                <div key={log.id} className="space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {log.eventType === "login"
                                          ? uiText.usersAuthLogLogin
                                          : uiText.usersAuthLogLogout}
                                      </span>
                                      {!log.success && (
                                        <Badge
                                          variant="destructive"
                                          className="px-1.5 py-0 text-[10px]"
                                        >
                                          {uiText.usersAuthLogFailed}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground">
                                      {formatDate(log.loggedAt)}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                    <div>
                                      <span className="font-medium">
                                        {uiText.usersAuthLogIpLabel}
                                      </span>
                                      <span className="ml-1">
                                        {log.ipAddress ?? "-"}
                                      </span>
                                    </div>
                                    <div className="break-all">
                                      <span className="font-medium">
                                        {uiText.usersAuthLogAgentLabel}
                                      </span>
                                      <span className="ml-1">
                                        {log.userAgent ?? "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{uiText.usersAddDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{uiText.usersLabelEmail}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelPassword}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelName}</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelAffiliation}</Label>
              <Input
                value={form.affiliation}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, affiliation: event.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelDepartment}</Label>
              <Input
                value={form.department}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, department: event.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelPosition}</Label>
              <Select
                value={form.position}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, position: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={uiText.usersLabelPosition} />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelPhone}</Label>
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelContactEmail}</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                }
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <span className="text-sm text-muted-foreground">
                모든 동의 항목 확인(필수)
              </span>
            </div>
            <div className="grid gap-2">
              <Label>{uiText.usersLabelRole}</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={uiText.usersLabelRole} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              {uiText.actionCancel}
            </Button>
            <Button onClick={handleCreate}>{uiText.actionAdd}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{uiText.usersResetPasswordTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 text-sm text-muted-foreground">
            <p>{uiText.usersResetPasswordDescription}</p>
            <div className="grid gap-2">
              <Label>{uiText.usersResetPasswordLabel}</Label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
              />
            </div>
            {resetError && <p className="text-sm text-red-500">{resetError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false);
                setResetUserId(null);
                setResetPassword("");
                setResetError(null);
              }}
            >
              {uiText.actionCancel}
            </Button>
            <Button onClick={handleResetPassword}>
              {uiText.usersResetPasswordConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
