"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  Shield,
  Lock,
  Settings,
  ArrowRight,
} from "lucide-react";
import {
  useChangePasswordMutation,
  useUpdateUserProfileMutation,
} from "@/redux/api/user-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProfileSkeleton from "./profile-skeleton";
import { useGetUserInfoQuery } from "@/redux/api/api-query";

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  // only name is editable
  const [editMode, setEditMode] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const { data, isLoading: isUserLoading, refetch } = useGetUserInfoQuery({});
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();

  const userData = data ? data.data : null;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // --- Edit Profile (name only) ---
  const startEdit = () => {
    setEditMode(true);
    setNameValue(userData?.name || "");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setNameValue(userData?.name || "");
  };

  const saveProfile = async () => {
    if (!nameValue.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await updateUserProfile({ name: nameValue }).unwrap();
      toast.success("Profile updated successfully!");
      setEditMode(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update profile");
    }
  };

  // --- Password change ---
  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({ current: passwords.current, new: passwords.new }).unwrap();
      toast.success("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordSection(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || !userData) return <ProfileSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header + quick link to Order History */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-medium">Your Profile</h1>
            <p className="text-xs text-muted-foreground">
              Update your name and manage account security
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="gap-1 ">
          <Link href="/orders" className="text-xs px-3">
            View Order History
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Profile Info */}
      <Card className="shadow-none border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription className="text-xs">
            Personal details and account status
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editable: Name ONLY */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                value={editMode ? nameValue : userData.name}
                onChange={(e) => setNameValue(e.target.value)}
                readOnly={!editMode}
                className={!editMode ? "bg-muted" : ""}
              />
            </div>

            {/* Read-only: Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[11px] font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={userData.phone_number || ""}
                  readOnly
                  className="pl-10 bg-muted"
                  inputMode="tel"
                />
              </div>
            </div>

            {/* Read-only: Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[11px] font-medium">
                Role
              </Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-[10px]">
                  {userData.role
                    ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                    : ""}
                </Badge>
              </div>
            </div>

            {/* Read-only: Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[11px] font-medium">
                Account Status
              </Label>
              <Badge
                variant={userData.status === "active" ? "success" : "destructive"}
                className={cn(
                  userData.status === "active"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "",
                  "text-[10px]"
                )}
              >
                {userData.status
                  ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1)
                  : ""}
              </Badge>
            </div>
          </div>

          {/* Edit / Save / Cancel */}
          <div className="flex gap-3">
            {!editMode ? (
              <Button variant="outline" className="shadow-none text-xs" onClick={startEdit}>
                Edit Name
              </Button>
            ) : (
              <>
                <Button
                  onClick={saveProfile}
                  className="bg-primary shadow-none text-xs hover:bg-primary/90 text-primary-foreground"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  className="shadow-none text-xs"
                  onClick={cancelEdit}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          <Separator className="my-2" />

          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Login
              </Label>
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                {userData.last_login_at ? formatDate(userData.last_login_at) : "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </Label>
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                {userData.createdAt ? formatDate(userData.createdAt) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Security Settings</CardTitle>
                <CardDescription className="text-xs">
                  Manage your password and security preferences
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordSection((s) => !s)}
              className="flex items-center gap-2 shadow-none text-muted-foreground text-xs"
            >
              <Settings className="h-4 w-4" />
              {showPasswordSection ? "Hide" : "Change Password"}
            </Button>
          </div>
        </CardHeader>

        {showPasswordSection && (
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-[11px] font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))}
                    placeholder="Enter your current password"
                    className="pr-10 shadow-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-[11px] font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter new password"
                      className="pr-10 shadow-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword((s) => !s)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[11px] font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                      placeholder="Confirm new password"
                      className="pr-10 shadow-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Password requirements:</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Include at least one number</li>
                  <li>• Include at least one special character</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handlePasswordChange}
                  className="bg-primary shadow-none text-xs hover:bg-primary/90 text-primary-foreground"
                  disabled={
                    !passwords.current ||
                    !passwords.new ||
                    !passwords.confirm ||
                    isLoading ||
                    isChangingPassword
                  }
                >
                  {isLoading || isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  variant="outline"
                  className="shadow-none text-xs"
                  onClick={() => {
                    setPasswords({ current: "", new: "", confirm: "" });
                    setShowPasswordSection(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
