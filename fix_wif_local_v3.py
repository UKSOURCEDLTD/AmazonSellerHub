import subprocess
import os

# CONFIG
GCLOUD_PATH = r"C:\Users\Luke Needham\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
PROJECT_ID = "amz-seller-hub"
POOL = "github-pool-v3"
PROVIDER = "github-provider"

def run_cmd(args):
    full_cmd = [GCLOUD_PATH] + args
    print(f"Running: {full_cmd}")
    # shell=True required for .cmd execution on Windows usually, but with full path sometimes not.
    # We use shell=True to be safe for batch files.
    # formatting command for display
    print(f"CMD STRING: {subprocess.list2cmdline(full_cmd)}")
    
    res = subprocess.run(full_cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"FAILED: {res.stderr}")
        return False
    print(f"SUCCESS: {res.stdout}")
    return True

def main():
    # 1. Create Pool v3
    print("--- Creating Pool v3 ---")
    run_cmd(["iam", "workload-identity-pools", "create", POOL, 
             "--project", PROJECT_ID, 
             "--location", "global", 
             "--display-name", "GitHub Pool V3"])

    # 2. Create Provider
    # Minimal mapping to ensure success. We can add more later if needed.
    # BUT, GitHub Actions 'google-github-actions/auth' often checks 'repository' claims.
    # So we do need the repository mapping for security if we want to condition it.
    # The user's error was about 'attribute condition'. We will NOT set a condition for now.
    # just mapping.
    print("\n--- Creating Provider ---")
    mapping = "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"
    
    run_cmd([
        "iam", "workload-identity-pools", "providers", "create-oidc", PROVIDER,
        "--project", PROJECT_ID,
        "--location", "global",
        "--workload-identity-pool", POOL,
        "--display-name", "GitHub Provider",
        "--attribute-mapping", mapping,
        "--issuer-uri", "https://token.actions.githubusercontent.com"
    ])
    
    # 3. Bind Service Account
    print("\n--- Binding Service Account ---")
    repo = "UKSOURCEDLTD/AmazonSellerHub"
    sa = "github-action-sa@amz-seller-hub.iam.gserviceaccount.com"
    # principalSet://iam.googleapis.com/projects/328218260604/locations/global/workloadIdentityPools/github-pool-v3/attribute.repository/UKSOURCEDLTD/AmazonSellerHub
    # We need project NUMBER, not ID for the principal binding.
    # Assuming 328218260604 from previous context.
    principal = f"principalSet://iam.googleapis.com/projects/328218260604/locations/global/workloadIdentityPools/{POOL}/attribute.repository/{repo}"
    
    run_cmd([
        "iam", "service-accounts", "add-iam-policy-binding", sa,
        "--project", PROJECT_ID,
        "--role", "roles/iam.workloadIdentityUser",
        "--member", principal
    ])

if __name__ == "__main__":
    main()
