# Configuration Variables
$PROJECT_ID = "amz-seller-hub"
$PROJECT_NUMBER = "328218260604"
$POOL_ID = "github-actions-pool"
$PROVIDER_ID = "github-actions-provider"
$REPO_PATH = "UKSOURCEDLTD/AmazonSellerHub"
$SERVICE_ACCOUNT = "github-action-sa@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "Configuring Workload Identity Federation for $PROJECT_ID..." -ForegroundColor Cyan

# 1. Create Workload Identity Pool
Write-Host "Creating Workload Identity Pool: $POOL_ID..."
# Check if it exists first to avoid error, or use || true equivalent (Try/Catch)
try {
    gcloud iam workload-identity-pools create $POOL_ID `
        --project="$PROJECT_ID" `
        --location="global" `
        --display-name="GitHub Actions Pool"
}
catch {
    Write-Host "Pool might already exist or error occurred. Continuing..." -ForegroundColor Yellow
}

# 2. Create OIDC Provider
Write-Host "Creating OIDC Provider: $PROVIDER_ID..."
# We try to create it. If it exists, we might need to update it, but for now let's assume valid state or new creation.
# If it fails because it exists, we should probably run an update command instead.
# Let's try to delete it first to ensure clean state? No, that's destructive.
# Let's try update if create fails, or just use create and ignore "already exists" if the config is same.
# Actually, the user's issue is MAPPING. So we must ensure mapping is set.
# We will use `update-oidc` if it exists, or `create-oidc` if not.
# Simplest way: Check existence.

$poolExists = gcloud iam workload-identity-pools providers describe $PROVIDER_ID `
    --workload-identity-pool=$POOL_ID `
    --location="global" `
    --project=$PROJECT_ID 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Provider exists. Updating..."
    gcloud iam workload-identity-pools providers update-oidc $PROVIDER_ID `
        --project="$PROJECT_ID" `
        --location="global" `
        --workload-identity-pool="$POOL_ID" `
        --issuer-uri="https://token.actions.githubusercontent.com" `
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" `
        --attribute-condition="attribute.repository == '$REPO_PATH'"
}
else {
    Write-Host "Provider does not exist. Creating..."
    gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID `
        --project="$PROJECT_ID" `
        --location="global" `
        --workload-identity-pool="$POOL_ID" `
        --issuer-uri="https://token.actions.githubusercontent.com" `
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" `
        --attribute-condition="attribute.repository == '$REPO_PATH'"
}

# 3. IAM Binding
Write-Host "Adding IAM Policy Binding to Service Account..."
$PRINCIPAL = "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$REPO_PATH"

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT `
    --project="$PROJECT_ID" `
    --role="roles/iam.workloadIdentityUser" `
    --member="$PRINCIPAL"

Write-Host "------------------------------------------------"
Write-Host "Setup Complete." -ForegroundColor Green
Write-Host "Workload Identity Provider: projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"
Write-Host "Service Account: $SERVICE_ACCOUNT"
