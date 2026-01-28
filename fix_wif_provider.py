import subprocess
import json
import os

PROJECT_ID = "amz-seller-hub"
POOL_NAME = "github-pool"
PROVIDER_NAME = "github-provider"
REPO = "UKSOURCEDLTD/AmazonSellerHub"

def run_command(cmd_str):
    print(f"Running: {cmd_str}")
    result = subprocess.run(cmd_str, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(f"Success: {result.stdout}")
    return True

def create_provider():
    # 1. Create Pool
    print("--- Creating Pool ---")
    run_command(f"gcloud iam workload-identity-pools create {POOL_NAME} --project={PROJECT_ID} --location=global --display-name='GitHub Pool'")

    # 2. Create Provider
    print("\n--- Creating Provider ---")
    # Try create
    create_cmd = (
        f"gcloud iam workload-identity-pools providers create-oidc {PROVIDER_NAME} "
        f"--project={PROJECT_ID} --location=global --workload-identity-pool={POOL_NAME} "
        f"--display-name='GitHub Provider' "
        f"--attribute-mapping='google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository' "
        f"--issuer-uri='https://token.actions.githubusercontent.com'"
    )
    success = run_command(create_cmd)
    
    if not success:
        print("Creation failed, trying UPDATE instead...")
        update_cmd = (
            f"gcloud iam workload-identity-pools providers update-oidc {PROVIDER_NAME} "
            f"--project={PROJECT_ID} --location=global --workload-identity-pool={POOL_NAME} "
            f"--attribute-mapping='google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository' "
            f"--issuer-uri='https://token.actions.githubusercontent.com'"
        )
        run_command(update_cmd)

if __name__ == "__main__":
    create_provider()
