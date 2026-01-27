# GitHub Actions Deployment

This folder contains the automated deployment pipeline for the Amazon Seller Hub.

## Workflow: firebase-hosting-merge.yml

**Triggers:** Pushes to `main` or `master` branches

**What it does:**
1. Builds the Next.js frontend with Firebase configuration
2. Installs Python dependencies for Cloud Functions
3. Deploys both hosting and functions to Firebase

**Authentication:** Uses Workload Identity Federation for secure, keyless authentication to Google Cloud.

## Required GitHub Secrets

You need to set these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

### Firebase Configuration
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase Web API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - (Optional) Firebase analytics measurement ID

### Setup Instructions

Run the setup script from the project root:
```powershell
.\setup_github_secrets.ps1
```

This script will guide you through setting up all required secrets.

## Troubleshooting

**Build fails at frontend build step:**
- Verify all `NEXT_PUBLIC_FIREBASE_*` secrets are set correctly
- Check that the secrets don't have extra quotes or spaces

**Build fails at Python dependencies:**
- Ensure `functions/requirements.txt` exists and is valid
- Check Python version compatibility (using 3.11)

**Deployment fails:**
- Verify Workload Identity Federation is configured correctly
- Check that the service account has necessary Firebase permissions
- Ensure `FIREBASE_SERVICE_ACCOUNT` secret is valid JSON

**View build logs:**
Go to GitHub > Actions tab > Click on the failed workflow run
