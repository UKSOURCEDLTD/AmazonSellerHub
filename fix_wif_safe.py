import subprocess

PROJECT_ID = "amz-seller-hub"
POOL_NAME = "github-pool"
PROVIDER_NAME = "github-provider"

def run_safe(cmd_list):
    print(f"Executing: {cmd_list}")
    # On Windows, allow python to handle quoting
    res = subprocess.run(cmd_list, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"FAIL: {res.stderr}")
        return False
    print(f"SUCCESS: {res.stdout}")
    return True

def fix():
    # 1. Delete (Ignore error)
    run_safe(["gcloud", "iam", "workload-identity-pools", "providers", "delete", PROVIDER_NAME,
              "--project", PROJECT_ID, "--location", "global", "--workload-identity-pool", POOL_NAME, "--quiet"])

    # 2. Create with Minimal Args
    # We strip spaces from mapping just in case
    mapping = "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"
    
    cmd = [
        "gcloud", "iam", "workload-identity-pools", "providers", "create-oidc", PROVIDER_NAME,
        "--project", PROJECT_ID,
        "--location", "global",
        "--workload-identity-pool", POOL_NAME,
        "--display-name", "GitHub Provider",
        "--issuer-uri", "https://token.actions.githubusercontent.com",
        "--attribute-mapping", mapping
    ]
    
    if run_safe(cmd):
        print("Provider Created!")
    else:
        print("Creation Failed.")

if __name__ == "__main__":
    fix()
