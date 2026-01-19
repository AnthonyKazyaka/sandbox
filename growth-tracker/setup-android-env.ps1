# Growth Tracker Android Build Setup
# Run this before building the Android app

$env:ANDROID_HOME = "C:\Users\askan\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\askan\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

Write-Host "✓ Android environment configured" -ForegroundColor Green
Write-Host "  ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to build! Run:" -ForegroundColor Yellow
Write-Host "  npx expo run:android" -ForegroundColor Cyan
