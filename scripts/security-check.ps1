function Get-EnvVal {
    param([string]$Name)
    foreach ($scope in @("Process", "User", "Machine")) {
        $value = [Environment]::GetEnvironmentVariable($Name, $scope)
        if ($value) { return $value }
    }
    return $null
}

$vars = @(
    "JWT_SECRET_KEY",
    "APP_ENV",
    "ALLOW_DEV_LOGIN",
    "CORS_ALLOW_ORIGINS",
    "COOKIE_SAMESITE",
    "COOKIE_DOMAIN",
    "ENABLE_HSTS",
    "HSTS_PRELOAD",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS",
    "LOGIN_RATE_LIMIT",
    "LOGIN_RATE_LIMIT_STORE",
    "CSRF_DISABLED",
    "DEV_LOGIN_SECRET",
    "JWT_ISSUER"
)

$vars | ForEach-Object {
    $value = Get-EnvVal $_
    if ($value) {
        Write-Output "$_=$value"
    } else {
        Write-Output "$_=<missing>"
    }
}

$warnings = @()

$jwt = Get-EnvVal "JWT_SECRET_KEY"
if (-not $jwt -or $jwt -eq "change-me-in-production") {
    $warnings += "WARN: JWT_SECRET_KEY is missing or default"
}

$appEnv = (Get-EnvVal "APP_ENV")
if (-not $appEnv) {
    $warnings += "WARN: APP_ENV is not set (defaults to development)"
}

$allowDev = Get-EnvVal "ALLOW_DEV_LOGIN"
if ($allowDev -eq "1" -and $appEnv -and $appEnv.ToLower() -eq "production") {
    $warnings += "WARN: ALLOW_DEV_LOGIN=1 in production"
}
if ($allowDev -eq "1" -and -not (Get-EnvVal "DEV_LOGIN_SECRET")) {
    $warnings += "WARN: DEV_LOGIN_SECRET is missing while ALLOW_DEV_LOGIN=1"
}

$cors = Get-EnvVal "CORS_ALLOW_ORIGINS"
if (-not $cors) {
    $warnings += "WARN: CORS_ALLOW_ORIGINS is empty"
} elseif ($cors -match "\\*") {
    $warnings += "WARN: CORS_ALLOW_ORIGINS contains *"
}

$hsts = Get-EnvVal "ENABLE_HSTS"
if ($appEnv -and $appEnv.ToLower() -eq "production" -and $hsts -ne "1") {
    $warnings += "WARN: ENABLE_HSTS is not enabled in production"
}

$csrfDisabled = Get-EnvVal "CSRF_DISABLED"
if ($csrfDisabled -eq "1") {
    $warnings += "WARN: CSRF protection is disabled"
}

if ($warnings.Count -eq 0) {
    Write-Output "OK: No critical misconfig found."
} else {
    $warnings | ForEach-Object { Write-Output $_ }
}
