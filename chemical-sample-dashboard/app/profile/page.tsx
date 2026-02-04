"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { deleteAccount, updateProfile } from "@/lib/data/auth";
import { getUiText } from "@/lib/ui-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const uiText = getUiText("KR");
  const positionLabels: Record<string, string> = {
    undergraduate: uiText.positionUndergraduate,
    masters: uiText.positionMasters,
    phd: uiText.positionPhd,
    postdoc: uiText.positionPostdoc,
    researcher: uiText.positionResearcher,
    professor: uiText.positionProfessor,
  };
  const positionOptions = [
    { value: "undergraduate", label: uiText.positionUndergraduate },
    { value: "masters", label: uiText.positionMasters },
    { value: "phd", label: uiText.positionPhd },
    { value: "postdoc", label: uiText.positionPostdoc },
    { value: "researcher", label: uiText.positionResearcher },
    { value: "professor", label: uiText.positionProfessor },
  ];
  const avatarOptions = [
    "/avatars/avatar-1.png",
    "/avatars/avatar-2.png",
    "/avatars/avatar-3.png",
  ];
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    affiliation: "",
    department: "",
    position: "",
    phone: "",
    contactEmail: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    setFormState({
      name: user.name ?? "",
      affiliation: user.affiliation ?? "",
      department: user.department ?? "",
      position: user.position ?? "",
      phone: user.phone ?? "",
      contactEmail: user.contactEmail ?? "",
      profileImageUrl: user.profileImageUrl ?? "",
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: formState.name.trim() || null,
        affiliation: formState.affiliation.trim() || null,
        department: formState.department.trim() || null,
        position: formState.position || null,
        phone: formState.phone.trim() || null,
        contactEmail: formState.contactEmail.trim() || null,
        profileImageUrl: formState.profileImageUrl || null,
      });
      await refreshUser();
      toast({ title: uiText.profileUpdateSuccess });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : uiText.profileUpdateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormState({
      name: user.name ?? "",
      affiliation: user.affiliation ?? "",
      department: user.department ?? "",
      position: user.position ?? "",
      phone: user.phone ?? "",
      contactEmail: user.contactEmail ?? "",
      profileImageUrl: user.profileImageUrl ?? "",
    });
    setIsEditing(false);
    setError(null);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl space-y-4">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleCancel() : router.back())}
          >
            {uiText.profileBackButton}
          </Button>
        </div>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{uiText.profileTitle}</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                {uiText.profileEditButton}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                {uiText.profileAvatarLabel}
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {uiText.profileAvatarHint}
                </p>
              </div>
              {isEditing && (
                <div className="grid grid-cols-3 gap-3">
                  {avatarOptions.map((option) => {
                    const selected = formState.profileImageUrl === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            profileImageUrl: option,
                          }))
                        }
                        className={cn(
                          "flex items-center justify-center rounded-lg border border-border p-3 transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        )}
                        aria-pressed={selected}
                      >
                        <Avatar className="size-12">
                          <AvatarImage src={option} />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                {uiText.profileSectionLabel}
              </div>
              {!isEditing && (
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profileEmailLabel}</span>
                    <span className="font-medium">{user?.email || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profileNameLabel}</span>
                    <span className="font-medium">{user?.name || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profileAffiliationLabel}</span>
                    <span className="font-medium">{user?.affiliation || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profileDepartmentLabel}</span>
                    <span className="font-medium">{user?.department || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profilePositionLabel}</span>
                    <span className="font-medium">
                      {user?.position
                        ? positionLabels[user.position] || user.position
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profilePhoneLabel}</span>
                    <span className="font-medium">{user?.phone || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {uiText.profileContactEmailLabel}
                    </span>
                    <span className="font-medium">{user?.contactEmail || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{uiText.profileRoleLabel}</span>
                    <span className="font-medium">
                      {user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser}
                    </span>
                  </div>
                </div>
              )}
              {isEditing && (
                <div className="grid gap-4 text-sm">
                  <div className="grid gap-2">
                    <Label>{uiText.profileNameLabel}</Label>
                    <Input
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{uiText.profileAffiliationLabel}</Label>
                    <Input
                      value={formState.affiliation}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          affiliation: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{uiText.profileDepartmentLabel}</Label>
                    <Input
                      value={formState.department}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          department: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{uiText.profilePositionLabel}</Label>
                    <Select
                      value={formState.position}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, position: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={uiText.profilePositionLabel} />
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
                    <Label>{uiText.profilePhoneLabel}</Label>
                    <Input
                      value={formState.phone}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{uiText.profileContactEmailLabel}</Label>
                    <Input
                      type="email"
                      value={formState.contactEmail}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          contactEmail: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {isEditing && (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      {uiText.profileCancelButton}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {uiText.profileSaveButton}
                    </Button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => void logout()}>
                  {uiText.profileLogoutButton}
                </Button>
                <ConfirmDialog
                  trigger={<Button variant="destructive">{uiText.profileMenuDelete}</Button>}
                  title={uiText.profileDeleteTitle}
                  description={uiText.profileDeleteDescription}
                  confirmText={uiText.profileDeleteConfirm}
                  cancelText={uiText.actionCancel}
                  onConfirm={async () => {
                    try {
                      await deleteAccount();
                      await logout();
                    } catch {
                      window.alert(uiText.profileDeleteFailed);
                    }
                  }}
                  variant="destructive"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
