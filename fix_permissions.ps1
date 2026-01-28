$PROJECT_ID = "amz-seller-hub"
$SERVICE_ACCOUNT = "915152220739@cloudbuild.gserviceaccount.com"
$ROLES = @(
    "roles/cloudfunctions.developer",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.editor",
    "roles/run.admin"
)

foreach ($role in $ROLES) {
    Write-Host "Adding binding for role: $role"
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT" --role=$role
}
