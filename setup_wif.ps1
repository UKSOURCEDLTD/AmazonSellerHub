# Configuration
$PROJECT_ID = "amz-seller-hub"
$POOL_NAME = "github-pool"
$PROVIDER_NAME = "github-provider"
$REPO = "UKSOURCEDLTD/AmazonSellerHub"
$SERVICE_ACCOUNT_NAME = "github-action-sa"
$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# 1. Enable APIs
Write-Host "Enabling IAM Credentials API..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID

# 2. Create Service Account (if not exists)
Write-Host "Creating Service Account..."
# Check if exists first
$sa_exists = gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID 2>&1
if ($LastExitCode -ne 0) {
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name="GitHub Actions Service Account" --project=$PROJECT_ID
}
else {
    Write-Host "Service Account already exists."
}

# 3. Create Workload Identity Pool
Write-Host "Creating/Updating Workload Identity Pool..."
# Try create, ignore if specific already exists error, but describing is safer
$pool_exists = gcloud iam workload-identity-pools describe $POOL_NAME --project=$PROJECT_ID --location="global" 2>&1
if ($LastExitCode -ne 0) {
    gcloud iam workload-identity-pools create $POOL_NAME --project=$PROJECT_ID --location="global" --display-name="GitHub Pool"
}
else {
    Write-Host "Pool already exists."
}

# 4. Create Workload Identity Provider
Write-Host "Creating/Updating Workload Identity Provider..."
$provider_exists = gcloud iam workload-identity-pools providers describe $PROVIDER_NAME --project=$PROJECT_ID --location="global" --workload-identity-pool=$POOL_NAME 2>&1
if ($LastExitCode -ne 0) {
    gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME `
        --project=$PROJECT_ID `
        --location="global" `
        --workload-identity-pool=$POOL_NAME `
        --display-name="GitHub Provider" `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
        --issuer-uri="https://token.actions.githubusercontent.com"
}
else {
    Write-Host "Provider already exists. Updating..."
    gcloud iam workload-identity-pools providers update-oidc $PROVIDER_NAME `
        --project=$PROJECT_ID `
        --location="global" `
        --workload-identity-pool=$POOL_NAME `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
        --issuer-uri="https://token.actions.githubusercontent.com"
}

# 5. Allow GitHub Repo to Impersonate Service Account
Write-Host "Binding Policy..."
$repo_claim = "principalSet://iam.googleapis.com/projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$REPO"

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL `
    --project=$PROJECT_ID `
    --role="roles/iam.workloadIdentityUser" `
    --member=$repo_claim --condition=None

# 6. Grant Permissions to Service Account
# We need to ensure correct roles for Cloud Run / Functions Gen 2 deployment
Write-Host "Granting Roles..."
$ROLES = @(
    "roles/editor",
    "roles/cloudfunctions.developer",
    "roles/firebase.admin",
    "roles/secretmanager.secretAccessor",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.editor",
    "roles/run.admin",
    "roles/artifactregistry.admin"
)
foreach ($role in $ROLES) {
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role=$role --condition=None
}

# 7. Output Provider Name for GitHub Actions
$PROVIDER_ID = gcloud iam workload-identity-pools providers describe $PROVIDER_NAME --project=$PROJECT_ID --location="global" --workload-identity-pool=$POOL_NAME --format="value(name)"

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "SETUP COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "UPDATED GITHUB WORKFLOW VALUES:"
Write-Host "workload_identity_provider: '$PROVIDER_ID'"
Write-Host "service_account: '$SERVICE_ACCOUNT_EMAIL'"
