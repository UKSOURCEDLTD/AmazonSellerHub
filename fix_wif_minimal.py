import subprocess
import sys

PROJECT_ID = "amz-seller-hub"
POOL_NAME = "github-pool"
PROVIDER_NAME = "github-provider"

def run_command(cmd_list):
    print(f"Running: {cmd_list}")
    # shell=True on Windows required for gcloud command if not full path
    # But passing a list with shell=True on Windows is problematic (it joins with spaces).
    # We will construct the string manually to be safe.
    cmd_str = subprocess.list2cmdline(cmd_list)
    print(f"Command string: {cmd_str}")
    result = subprocess.run(cmd_str, capture_output=True, text=True, shell=True)
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(f"Success: {result.stdout}")
    return True

def create_minimal_provider():
    # 1. Create Pool
    print("--- Creating Pool ---")
    run_command([
        "gcloud", "iam", "workload-identity-pools", "create", POOL_NAME,
        "--project", PROJECT_ID,
        "--location", "global",
        "--display-name", "GitHub Pool"
    ])

    # 2. Create Provider (Minimal Mapping)
    print("\n--- Creating Provider (Minimal) ---")
    # Only map google.subject
    success = run_command([
        "gcloud", "iam", "workload-identity-pools", "providers", "create-oidc", PROVIDER_NAME,
        "--project", PROJECT_ID,
        "--location", "global",
        "--workload-identity-pool", POOL_NAME,
        "--display-name", "GitHub Provider",
        "--attribute-mapping", "google.subject=assertion.sub",
        "--issuer-uri", "https://token.actions.githubusercontent.com"
    ])

    if success:
        print("\n--- Updating Provider (Adding Attributes) ---")
        run_command([
            "gcloud", "iam", "workload-identity-pools", "providers", "update-oidc", PROVIDER_NAME,
            "--project", PROJECT_ID,
            "--location", "global",
            "--workload-identity-pool", POOL_NAME,
            "--attribute-mapping", "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository",
            "--issuer-uri", "https://token.actions.githubusercontent.com"
        ])

if __name__ == "__main__":
    create_minimal_provider()
