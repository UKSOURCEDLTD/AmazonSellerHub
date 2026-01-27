$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   GitHub Secrets Setup Wizard" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Firebase Service Account (for Workload Identity)
Write-Host "`n[1/3] Setting up Firebase Service Account..."
Write-Host "The workflow uses Workload Identity Federation, but we also need the service account JSON."
Write-Host "Paste the entire contents of your Firebase service account JSON file:"
Write-Host "(This should be from the Firebase Console > Project Settings > Service Accounts)"

$serviceAccount = Read-Host "Paste Firebase Service Account JSON"

if (-not [string]::IsNullOrWhiteSpace($serviceAccount)) {
    Write-Host "Uploading FIREBASE_SERVICE_ACCOUNT to GitHub..."
    echo $serviceAccount | gh secret set FIREBASE_SERVICE_ACCOUNT
    Write-Host "Success!" -ForegroundColor Green
}
else {
    Write-Host "Skipped FIREBASE_SERVICE_ACCOUNT." -ForegroundColor Yellow
}

# 2. Web Config
Write-Host "`n[2/3] Setting up Frontend Config..."
Write-Host "We need your Firebase Web App configuration."
Write-Host "Run 'npx firebase-tools apps:sdkconfig web' in another terminal OR check Project Settings > General in Console."
Write-Host "Please paste the values requested below:"

$apiKey = Read-Host "apiKey (NEXT_PUBLIC_FIREBASE_API_KEY)"
if ($apiKey) { echo $apiKey | gh secret set NEXT_PUBLIC_FIREBASE_API_KEY }

$authDomain = Read-Host "authDomain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)"
if ($authDomain) { echo $authDomain | gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }

$projectId = Read-Host "projectId (NEXT_PUBLIC_FIREBASE_PROJECT_ID)"
if ($projectId) { echo $projectId | gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID }

$storageBucket = Read-Host "storageBucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)"
if ($storageBucket) { echo $storageBucket | gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }

$messagingSenderId = Read-Host "messagingSenderId (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
if ($messagingSenderId) { echo $messagingSenderId | gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }

$appId = Read-Host "appId (NEXT_PUBLIC_FIREBASE_APP_ID)"
if ($appId) { echo $appId | gh secret set NEXT_PUBLIC_FIREBASE_APP_ID }

$measurementId = Read-Host "measurementId (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) [Optional]"
if ($measurementId) { echo $measurementId | gh secret set NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }

Write-Host "`n[3/3] Verifying secrets..."
Write-Host "Listing all secrets set in the repository:"
gh secret list

Write-Host "`nDone! All secrets uploaded." -ForegroundColor Green
Write-Host "Your deployment pipeline is now configured!" -ForegroundColor Green
