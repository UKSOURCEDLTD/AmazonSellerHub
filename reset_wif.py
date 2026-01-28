import subprocess
import time

PROJECT_ID = "amz-seller-hub"
POOL_NAME = "github-pool"
PROVIDER_NAME = "github-provider"

def run_shell(cmd):
    print(f"\n[EXEC] {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[ERROR] {res.stderr.strip()}")
        return False
    print(f"[OK] {res.stdout.strip()}")
    return True

def reset_provider():
    # 1. Delete Provider (Clean Slate)
    print("--- Deleting Provider ---")
    run_shell(f"gcloud iam workload-identity-pools providers delete {PROVIDER_NAME} --workload-identity-pool={POOL_NAME} --project={PROJECT_ID} --location=global --quiet")
    
    # 2. Create Provider (Pure String, carefully quoted)
    print("\n--- Creating Provider ---")
    # We use single quotes for values to avoid shell issues with assertions
    create_cmd = (
        f"gcloud iam workload-identity-pools providers create-oidc {PROVIDER_NAME} "
        f"--project={PROJECT_ID} "
        f"--location=global "
        f"--workload-identity-pool={POOL_NAME} "
        f"--display-name=\"GitHub Provider\" "
        f"--attribute-mapping=\"google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository\" "
        f"--issuer-uri=\"https://token.actions.githubusercontent.com\""
    )
    
    if run_shell(create_cmd):
        print("\nSUCCESS: Provider created.")
    else:
        print("\nFAILED: Could not create provider.")

if __name__ == "__main__":
    reset_provider()
