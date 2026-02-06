"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AlertCircle, CheckCircle2, Globe, Moon, Sun } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LANGUAGE_OPTIONS, getUiText } from "@/lib/ui-text";
import { login, signup } from "@/lib/data/auth";
import { consentText } from "@/lib/consent-text";
import type { SignupConsent } from "@/lib/types";
import { ApiError } from "@/lib/api";
import {
  clearRememberedEmail,
  getRememberedEmail,
  saveRememberedEmail,
} from "@/lib/auth-storage";
import { useAuth } from "@/lib/auth-context";
import { useUiLanguage } from "@/lib/use-ui-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandingToolbar } from "@/components/landing/toolbar";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage } = useUiLanguage();
  const uiText = getUiText(language);
  const allowTestLogin = process.env.NEXT_PUBLIC_ALLOW_DEV_BYPASS === "1";
  const testLoginEmail =
    process.env.NEXT_PUBLIC_TEST_LOGIN_EMAIL || "msu@msu.lab.kr";
  const testLoginPassword =
    process.env.NEXT_PUBLIC_TEST_LOGIN_PASSWORD || "Test1234";
  const consentVersion = "2026-02-04";
  const positionOptions = [
    { value: "undergraduate", label: uiText.positionUndergraduate },
    { value: "masters", label: uiText.positionMasters },
    { value: "phd", label: uiText.positionPhd },
    { value: "postdoc", label: uiText.positionPostdoc },
    { value: "researcher", label: uiText.positionResearcher },
    { value: "professor", label: uiText.positionProfessor },
  ];
  const lightPrimaryButtonClass =
    "bg-[#4AD4D7] text-foreground hover:bg-[#4AD4D7]/90";

  const [activeTab, setActiveTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRememberEmail, setLoginRememberEmail] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupAffiliation, setSignupAffiliation] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("");
  const [signupPosition, setSignupPosition] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupContactEmail, setSignupContactEmail] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);
  const [consentPhone, setConsentPhone] = useState(false);
  const [consentIotEnvironment, setConsentIotEnvironment] = useState(false);
  const [consentIotReagent, setConsentIotReagent] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [consentVideo, setConsentVideo] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupFieldErrors, setSignupFieldErrors] = useState<{
    email?: string;
    password?: string;
    contactEmail?: string;
  }>({});
  const [showEmailExample, setShowEmailExample] = useState(false);
  const [showPasswordExample, setShowPasswordExample] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getErrorCode = (detail: unknown): string | null => {
    if (!detail || typeof detail !== "object") return null;
    const code = (detail as { code?: string }).code;
    return typeof code === "string" ? code : null;
  };

  const parseSignupValidationErrors = (detail: unknown) => {
    const fieldErrors: {
      email?: string;
      password?: string;
      contactEmail?: string;
    } = {};
    if (Array.isArray(detail)) {
      (detail as any[]).forEach((item: any) => {
        const loc = Array.isArray(item.loc) ? item.loc : [];
        if (loc.includes("email")) {
          fieldErrors.email = uiText.signupEmailInvalid;
        }
        if (loc.includes("password")) {
          fieldErrors.password = uiText.signupPasswordInvalid;
        }
        if (loc.includes("contactEmail") || loc.includes("contact_email")) {
          fieldErrors.contactEmail = uiText.signupContactEmailInvalid;
        }
      });
    }
    return fieldErrors;
  };

  const emailValue = signupEmail.trim();
  const passwordValue = signupPassword.trim();
  const contactEmailValue = signupContactEmail.trim();
  const loginEmailValue = loginEmail.trim();
  const loginPasswordValue = loginPassword.trim();
  const emailValid = /^\S+@\S+\.\S+$/.test(emailValue);
  const contactEmailValid =
    contactEmailValue.length === 0 || /^\S+@\S+\.\S+$/.test(contactEmailValue);
  const passwordValid =
    passwordValue.length >= 8 &&
    /[A-Za-z]/.test(passwordValue) &&
    /\d/.test(passwordValue);
  const loginEmailValid = /^\S+@\S+\.\S+$/.test(loginEmailValue);
  const loginPasswordValid =
    loginPasswordValue.length >= 8 &&
    /[A-Za-z]/.test(loginPasswordValue) &&
    /\d/.test(loginPasswordValue);
  const passwordStrengthScore =
    (passwordValue.length >= 8 ? 1 : 0) +
    (/[A-Za-z]/.test(passwordValue) ? 1 : 0) +
    (/\d/.test(passwordValue) ? 1 : 0) +
    (passwordValue.length >= 12 ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(passwordValue) ? 1 : 0);
  const passwordStrength =
    passwordStrengthScore >= 4
      ? uiText.passwordStrengthStrong
      : passwordStrengthScore >= 3
        ? uiText.passwordStrengthMedium
        : uiText.passwordStrengthWeak;
  const liveEmailError =
    emailValue.length > 0 && !emailValid ? uiText.signupEmailInvalid : undefined;
  const liveContactEmailError =
    contactEmailValue.length > 0 && !contactEmailValid
      ? uiText.signupContactEmailInvalid
      : undefined;
  const livePasswordError =
    passwordValue.length > 0 && !passwordValid
      ? uiText.signupPasswordInvalid
      : undefined;
  const displayEmailError = signupFieldErrors.email ?? liveEmailError;
  const displayContactEmailError =
    signupFieldErrors.contactEmail ?? liveContactEmailError;
  const displayPasswordError = signupFieldErrors.password ?? livePasswordError;

  const loginDisabled =
    isLoading ||
    !loginEmailValue ||
    !loginPasswordValue ||
    !loginEmailValid ||
    !loginPasswordValid;
  const signupDisabled =
    isLoading ||
    !signupEmail.trim() ||
    !signupPassword.trim() ||
    !signupName.trim() ||
    !signupAffiliation.trim() ||
    !signupDepartment.trim() ||
    !signupPosition.trim() ||
    !emailValid ||
    !contactEmailValid ||
    !passwordValid;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const stored = getRememberedEmail();
    if (stored.enabled) {
      setLoginEmail(stored.email);
      setLoginRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    setLoginError(null);
    setSignupError(null);
    setSignupFieldErrors({});
    setShowEmailExample(false);
    setShowPasswordExample(false);
  }, [activeTab]);

  const handleAuth = async (
    mode: "login" | "signup",
    consent?: SignupConsent,
    override?: { email?: string; password?: string; rememberEmail?: boolean }
  ) => {
    setIsLoading(true);
    setLoginError(null);
    setSignupError(null);
    setSignupFieldErrors({});
    try {
      if (mode === "signup" && !consent) {
        throw new Error("Consent required");
      }
      if (mode === "login") {
        const email = (override?.email ?? loginEmail).trim();
        const password = (override?.password ?? loginPassword).trim();
        await login({ email, password });
        const remember = override?.rememberEmail ?? loginRememberEmail;
        if (remember) {
          saveRememberedEmail(email);
        } else {
          clearRememberedEmail();
        }
      } else {
        await signup({
          email: signupEmail.trim(),
          password: signupPassword.trim(),
          name: signupName.trim(),
          affiliation: signupAffiliation.trim(),
          department: signupDepartment.trim(),
          position: signupPosition.trim(),
          phone: signupPhone.trim() || undefined,
          contactEmail: signupContactEmail.trim() || undefined,
          consent: consent as SignupConsent,
        });
      }
      await refreshUser();
      router.replace("/dashboard");
      return true;
    } catch (err) {
      if (mode === "login") {
        let message = uiText.loginError;
        if (err instanceof ApiError) {
          const code = getErrorCode(err.detail);
          if (code === "INVALID_CREDENTIALS") {
            message = uiText.loginInvalidCredentials;
          } else if (code === "ACCOUNT_INACTIVE") {
            message = uiText.loginAccountInactive;
          } else if (code === "RATE_LIMITED") {
            message = uiText.authRateLimit;
          } else if (err.status === 422) {
            message = uiText.loginInvalidInput;
          } else if (err.message) {
            message = err.message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        setLoginError(message);
        } else {
        let message: string | null = null;
        let fieldErrors: {
          email?: string;
          password?: string;
          contactEmail?: string;
        } = {};
        if (err instanceof ApiError) {
          const code = getErrorCode(err.detail);
          if (code === "EMAIL_EXISTS") {
            fieldErrors.email = uiText.signupEmailExists;
          } else if (code === "PASSWORD_POLICY") {
            fieldErrors.password = uiText.signupPasswordInvalid;
          } else if (code === "RATE_LIMITED") {
            message = uiText.authRateLimit;
          } else if (code === "INVALID_REQUEST") {
            message = uiText.signupInvalidRequest;
          }
          if (err.status === 422) {
            fieldErrors = {
              ...fieldErrors,
              ...parseSignupValidationErrors(err.detail),
            };
          }
          if (!message && Object.keys(fieldErrors).length === 0 && err.message) {
            message = err.message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        } else {
          message = uiText.loginError;
        }
        setSignupFieldErrors(fieldErrors);
        setSignupError(message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setActiveTab("login");
    setLoginEmail(testLoginEmail);
    setLoginPassword(testLoginPassword);
    await handleAuth("login", undefined, {
      email: testLoginEmail,
      password: testLoginPassword,
      rememberEmail: loginRememberEmail,
    });
  };

  const openConsentDialog = () => {
    setSignupError(null);
    setSignupFieldErrors({});
    const missingSignupFields = [
      signupEmail,
      signupPassword,
      signupName,
      signupAffiliation,
      signupDepartment,
      signupPosition,
    ].some((value) => value.trim().length === 0);

    if (missingSignupFields) {
      setSignupError(uiText.signupRequiredFields);
      return;
    }

    const fieldErrors: {
      email?: string;
      password?: string;
      contactEmail?: string;
    } = {};
    if (!emailValid) {
      fieldErrors.email = uiText.signupEmailInvalid;
    }
    if (!passwordValid) {
      fieldErrors.password = uiText.signupPasswordInvalid;
    }
    if (!contactEmailValid) {
      fieldErrors.contactEmail = uiText.signupContactEmailInvalid;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setSignupFieldErrors(fieldErrors);
      return;
    }
    setConsentRequired(false);
    setConsentPhone(false);
    setConsentIotEnvironment(false);
    setConsentIotReagent(false);
    setConsentVoice(false);
    setConsentVideo(false);
    setConsentMarketing(false);
    setConsentOpen(true);
  };

  const handleSignupConsent = async () => {
    const consentPayload: SignupConsent = {
      version: consentVersion,
      required: consentRequired,
      phone: consentPhone,
      iotEnvironment: consentIotEnvironment,
      iotReagent: consentIotReagent,
      voice: consentVoice,
      video: consentVideo,
      marketing: consentMarketing,
    };
    if (
      !consentPayload.required ||
      !consentPayload.iotEnvironment ||
      !consentPayload.iotReagent ||
      !consentPayload.video
    ) {
      setSignupError(uiText.signupConsentRequired);
      return;
    }
    const ok = await handleAuth("signup", consentPayload);
    if (ok) {
      setConsentOpen(false);
    }
  };

  const consentValues = [
    consentRequired,
    consentPhone,
    consentIotEnvironment,
    consentIotReagent,
    consentVoice,
    consentVideo,
    consentMarketing,
  ];
  const allConsentChecked = consentValues.every(Boolean);
  const someConsentChecked = consentValues.some(Boolean);
  const consentAllState: boolean | "indeterminate" = allConsentChecked
    ? true
    : someConsentChecked
      ? "indeterminate"
      : false;

  const setAllConsents = (checked: boolean) => {
    setConsentRequired(checked);
    setConsentPhone(checked);
    setConsentIotEnvironment(checked);
    setConsentIotReagent(checked);
    setConsentVoice(checked);
    setConsentVideo(checked);
    setConsentMarketing(checked);
  };

  const canSubmitConsent =
    consentRequired &&
    consentIotEnvironment &&
    consentIotReagent &&
    consentVideo &&
    !isLoading;

  const handleLoginSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (loginDisabled) return;
    void handleAuth("login");
  };

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--tone-3)]">
      <LandingToolbar navMode="home-only" showMenu={false} />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md light-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{uiText.loginTitle}</CardTitle>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleTheme}
                title={
                  resolvedTheme === "dark"
                    ? uiText.settingsThemeLight
                    : uiText.settingsThemeDark
                }
                aria-label={
                  resolvedTheme === "dark"
                    ? uiText.settingsThemeLight
                    : uiText.settingsThemeDark
                }
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-3.5" />
                ) : (
                  <Moon className="size-3.5" />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                >
                  <Globe className="size-3.5" />
                  {language}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={language === option.code ? "bg-accent" : ""}
                  >
                    {option.label} ({option.code})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{uiText.loginTabLogin}</TabsTrigger>
              <TabsTrigger value="signup">{uiText.loginTabSignup}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="grid gap-2">
                  <Label>{uiText.loginLabelEmail}</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={loginEmail}
                      className="pr-9"
                      onChange={(event) => {
                        setLoginEmail(event.target.value);
                        setLoginError(null);
                      }}
                    />
                    {loginEmail.trim().length > 0 && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        {loginEmailValid ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="size-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uiText.loginEmailRule}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.loginLabelPassword}</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={loginPassword}
                      className="pr-9"
                      onChange={(event) => {
                        setLoginPassword(event.target.value);
                        setLoginError(null);
                      }}
                    />
                    {loginPasswordValue.length > 0 && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        {loginPasswordValid ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="size-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uiText.loginPasswordRule}
                  </p>
                </div>
                {loginError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {loginError}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={loginRememberEmail}
                    onCheckedChange={(checked) =>
                      setLoginRememberEmail(checked === true)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {uiText.loginRememberEmail}
                  </span>
                </div>
                <Button
                  className={`w-full ${lightPrimaryButtonClass}`}
                  type="submit"
                  disabled={loginDisabled}
                >
                  {uiText.loginButton}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label>{uiText.loginLabelEmail}</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={signupEmail}
                    className="pr-9"
                    onChange={(event) => {
                      setSignupEmail(event.target.value);
                      setSignupError(null);
                      setSignupFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    required
                  />
                  {emailValue.length > 0 && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValid ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{uiText.signupEmailRule}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowEmailExample((prev) => !prev)}
                  >
                    {showEmailExample
                      ? uiText.signupExampleHide
                      : uiText.signupExampleShow}
                  </button>
                </div>
                {showEmailExample && (
                  <p className="text-xs text-muted-foreground">
                    {uiText.signupEmailExample}
                  </p>
                )}
                {displayEmailError && (
                  <p className="text-xs text-red-500">{displayEmailError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>{uiText.loginLabelPassword}</Label>
                <div className="relative">
                  <Input
                    type="password"
                    value={signupPassword}
                    className="pr-9"
                    onChange={(event) => {
                      setSignupPassword(event.target.value);
                      setSignupError(null);
                      setSignupFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }}
                    required
                  />
                  {passwordValue.length > 0 && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordValid ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-destructive" />
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{uiText.signupPasswordRule}</span>
                  {passwordValue.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {uiText.passwordStrengthLabel}:{" "}
                      <span
                        className={
                          passwordStrength === uiText.passwordStrengthStrong
                            ? "text-emerald-500"
                            : passwordStrength === uiText.passwordStrengthMedium
                              ? "text-amber-500"
                              : "text-destructive"
                        }
                      >
                        {passwordStrength}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span />
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPasswordExample((prev) => !prev)}
                  >
                    {showPasswordExample
                      ? uiText.signupExampleHide
                      : uiText.signupExampleShow}
                  </button>
                </div>
                {showPasswordExample && (
                  <p className="text-xs text-muted-foreground">
                    {uiText.signupPasswordExample}
                  </p>
                )}
                {displayPasswordError && (
                  <p className="text-xs text-red-500">{displayPasswordError}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>{uiText.loginLabelName}</Label>
                <Input
                  value={signupName}
                  onChange={(event) => {
                    setSignupName(event.target.value);
                    setSignupError(null);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>{uiText.usersLabelAffiliation}</Label>
                <Input
                  value={signupAffiliation}
                  onChange={(event) => {
                    setSignupAffiliation(event.target.value);
                    setSignupError(null);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>{uiText.usersLabelDepartment}</Label>
                <Input
                  value={signupDepartment}
                  onChange={(event) => {
                    setSignupDepartment(event.target.value);
                    setSignupError(null);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>{uiText.usersLabelPosition}</Label>
                <Select
                  value={signupPosition}
                  onValueChange={(value) => {
                    setSignupPosition(value);
                    setSignupError(null);
                  }}
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
                  value={signupPhone}
                  onChange={(event) => {
                    setSignupPhone(event.target.value);
                    setSignupError(null);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>{uiText.usersLabelContactEmail}</Label>
                <Input
                  type="email"
                  value={signupContactEmail}
                  onChange={(event) => {
                    setSignupContactEmail(event.target.value);
                    setSignupError(null);
                    setSignupFieldErrors((prev) => ({
                      ...prev,
                      contactEmail: undefined,
                    }));
                  }}
                />
                {displayContactEmailError && (
                  <p className="text-xs text-red-500">{displayContactEmailError}</p>
                )}
              </div>
              {signupError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {signupError}
                </div>
              )}
              <Button
                className={`w-full ${lightPrimaryButtonClass}`}
                onClick={openConsentDialog}
                disabled={signupDisabled}
              >
                {uiText.signupButton}
              </Button>
            </TabsContent>
          </Tabs>

          {allowTestLogin && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleTestLogin}
                disabled={isLoading}
              >
                {uiText.loginDevBypassButton}
              </Button>
            </div>
          )}

          <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>개인정보 수집·이용·제공 동의</DialogTitle>
                <DialogDescription>
                  회원가입을 위해 아래 내용을 확인하고 필수 항목에 동의해
                  주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-72 overflow-y-auto rounded-md border p-3">
                <div className="prose prose-sm max-w-none text-foreground dark:prose-invert [&>*:first-child]:mt-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {consentText}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentRequired}
                    onCheckedChange={(checked) =>
                      setConsentRequired(checked === true)
                    }
                  />
                  <span className="text-sm">
                    위 내용을 확인했습니다 (필수)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentAllState}
                    onCheckedChange={(checked) =>
                      setAllConsents(checked === true)
                    }
                  />
                  <span className="text-sm">
                    전체 동의 (선택 포함)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">필수 동의</p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentIotEnvironment}
                    onCheckedChange={(checked) =>
                      setConsentIotEnvironment(checked === true)
                    }
                  />
                  <span className="text-sm">
                    온도·습도 데이터 수집·이용 동의 (필수)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentIotReagent}
                    onCheckedChange={(checked) =>
                      setConsentIotReagent(checked === true)
                    }
                  />
                  <span className="text-sm">
                    시약 재고 데이터 수집·이용 동의 (필수)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentVideo}
                    onCheckedChange={(checked) =>
                      setConsentVideo(checked === true)
                    }
                  />
                  <span className="text-sm">
                    영상 데이터 처리 동의 (민감정보/필수)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">선택 동의</p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentPhone}
                    onCheckedChange={(checked) =>
                      setConsentPhone(checked === true)
                    }
                  />
                  <span className="text-sm">
                    휴대전화번호 수집·이용 동의 (선택)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentVoice}
                    onCheckedChange={(checked) =>
                      setConsentVoice(checked === true)
                    }
                  />
                  <span className="text-sm">
                    음성 데이터 처리 동의 (민감정보/선택)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={consentMarketing}
                    onCheckedChange={(checked) =>
                      setConsentMarketing(checked === true)
                    }
                  />
                  <span className="text-sm">
                    마케팅 정보 수신 동의 (선택)
                  </span>
                </div>
              </div>
              {signupError && (
                <p className="text-sm text-red-500">{signupError}</p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConsentOpen(false)}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  className={lightPrimaryButtonClass}
                  type="button"
                  onClick={handleSignupConsent}
                  disabled={!canSubmitConsent}
                >
                  동의하고 회원가입
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
