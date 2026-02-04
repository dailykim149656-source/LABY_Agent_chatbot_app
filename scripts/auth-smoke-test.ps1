$base = "http://127.0.0.1:8000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Read-ErrorBody($err) {
  try {
    if ($err.Exception.Response -and $err.Exception.Response.GetResponseStream()) {
      $reader = New-Object System.IO.StreamReader($err.Exception.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
      $reader.Close()
      return $body
    }
  } catch {}
  return $null
}

function Get-CsrfToken($response, $session, $baseUrl) {
  if ($response -and $response.csrf_token) {
    return $response.csrf_token
  }
  try {
    $cookies = $session.Cookies.GetCookies($baseUrl)
    $cookie = $cookies["csrf_token"]
    if ($cookie) {
      return $cookie.Value
    }
  } catch {}
  return $null
}

Write-Host "[1] Login (msu@msu.lab.kr)" -ForegroundColor Cyan
$loginBody = @{ email = "msu@msu.lab.kr"; password = "Test1234" } | ConvertTo-Json -Compress
try {
  $response = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session
} catch {
  Write-Host "Login failed" -ForegroundColor Red
  $body = Read-ErrorBody $_
  if ($body) { Write-Host "Response: $body" -ForegroundColor Yellow }
  exit 1
}

$csrfToken = Get-CsrfToken $response $session $base
if (-not $csrfToken) {
  Write-Host "Warning: CSRF token not found" -ForegroundColor Yellow
}
Write-Host "Session established" -ForegroundColor Green

$csrfHeaders = @{}
if ($csrfToken) { $csrfHeaders["X-CSRF-Token"] = $csrfToken }

Write-Host "[2] /api/auth/me" -ForegroundColor Cyan
try {
  $me = Invoke-RestMethod -Uri "$base/api/auth/me" -WebSession $session
  $me | ConvertTo-Json -Depth 5
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Failed: $body" -ForegroundColor Yellow
}

Write-Host "[3] /api/health without token (expect 401)" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "$base/api/health" -Method Get -ErrorAction Stop
  Write-Host "Status: $($resp.StatusCode)"
} catch {
  if ($_.Exception.Response) {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $status"
    $body = Read-ErrorBody $_
    if ($body) { Write-Host "Response: $body" }
  } else {
    Write-Host "Request failed" -ForegroundColor Yellow
  }
}

Write-Host "[4] /api/health with cookie" -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri "$base/api/health" -WebSession $session
  $resp | ConvertTo-Json -Depth 5
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Failed: $body" -ForegroundColor Yellow
}

Write-Host "[5] /api/users list" -ForegroundColor Cyan
try {
  $users = Invoke-RestMethod -Uri "$base/api/users" -WebSession $session
  $users | ConvertTo-Json -Depth 5
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Failed: $body" -ForegroundColor Yellow
}

Write-Host "[6] Create user" -ForegroundColor Cyan
$newEmail = "test+$([guid]::NewGuid().ToString('N').Substring(0,8))@lab.com"
$newUser = @{ email = $newEmail; password = "test1234"; name = "Test User"; role = "user" } | ConvertTo-Json -Compress
try {
  $created = Invoke-RestMethod -Uri "$base/api/users" -Method Post -ContentType "application/json" -WebSession $session -Headers $csrfHeaders -Body $newUser
  $created | ConvertTo-Json -Depth 5
} catch {
  $body = Read-ErrorBody $_
  $status = $null
  if ($_.Exception.Response) { $status = $_.Exception.Response.StatusCode.value__ }
  if ($status) {
    Write-Host "Failed: $status" -ForegroundColor Yellow
  } else {
    Write-Host "Failed" -ForegroundColor Yellow
  }
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
  if ($body) { Write-Host "Response: $body" -ForegroundColor Yellow }
}

Write-Host "[7] Dev login (optional)" -ForegroundColor Cyan
try {
  $devHeaders = @{}
  if ($env:DEV_LOGIN_SECRET) { $devHeaders["X-Dev-Login-Secret"] = $env:DEV_LOGIN_SECRET }
  $dev = Invoke-RestMethod -Uri "$base/api/auth/dev-login" -Method Post -WebSession $session -Headers $devHeaders
  if ($dev.csrf_token) {
    Write-Host "Dev login ok" -ForegroundColor Green
  } else {
    Write-Host "Dev login returned no csrf token" -ForegroundColor Yellow
  }
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Dev login failed: $body" -ForegroundColor Yellow
}
