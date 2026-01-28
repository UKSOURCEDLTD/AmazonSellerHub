import re

def main():
    try:
        # PowerShell > creates UTF-16 LE by default
        with open('deploy_debug.log', 'r', encoding='utf-16', errors='ignore') as f:
            content = f.read()
            
        # Search for Build Log URL
        urls = re.findall(r'https://console\.cloud\.google\.com/cloud-build/builds/[^\s]+', content)
        if urls:
            print("FOUND BUILD LOG URLS:")
            for url in urls:
                print(url)
        else:
            print("NO BUILD LOG URL FOUND.")
            
        # Write last 300 lines to file
        lines = content.split('\n')
        with open('last_error_lines.txt', 'w', encoding='utf-8') as out:
            for line in lines[-300:]:
                out.write(line + '\n')
            print("Wrote last_error_lines.txt")
            
    except Exception as e:
        print(f"Error reading log: {e}")

if __name__ == "__main__":
    main()
