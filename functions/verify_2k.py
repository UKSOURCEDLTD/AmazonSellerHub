
import json
import os
import random
import shutil

DATA_DIR = r"c:\Users\Luke Needham\Documents\AMZHUB2\functions\data"
INVENTORY_FILE = os.path.join(DATA_DIR, "inventory.json")
BACKUP_FILE = os.path.join(DATA_DIR, "inventory_backup.json")

def generate_2k_items():
    if not os.path.exists(INVENTORY_FILE):
        print("Inventory file not found!")
        return

    # Backup
    print("Backing up inventory...")
    shutil.copy(INVENTORY_FILE, BACKUP_FILE)

    with open(INVENTORY_FILE, 'r') as f:
        original_data = json.load(f)
    
    if not original_data:
        print("No original data to duplicate.")
        return

    print(f"Original items: {len(original_data)}")
    
    new_data = []
    total_target = 2000
    
    while len(new_data) < total_target:
        for item in original_data:
            if len(new_data) >= total_target:
                break
            
            # Create a copy and modify ID to ensure uniqueness
            new_item = item.copy()
            suffix = f"_{len(new_data)}"
            new_item['id'] = new_item['id'] + suffix
            new_item['asin'] = new_item['asin'] + suffix
            new_item['sku'] = new_item['sku'] + suffix
            new_data.append(new_item)
            
    print(f"Generated {len(new_data)} items.")
    
    with open(INVENTORY_FILE, 'w') as f:
        json.dump(new_data, f, indent=2)
        
    print("Inventory updated with 2k items.")

def restore_inventory():
    if not os.path.exists(BACKUP_FILE):
        print("Backup file not found!")
        return
        
    print("Restoring inventory...")
    shutil.copy(BACKUP_FILE, INVENTORY_FILE)
    os.remove(BACKUP_FILE)
    print("RESTORED.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        restore_inventory()
    else:
        generate_2k_items()
