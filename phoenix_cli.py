#!/usr/bin/env python3
"""
PhoenixCySec CLI Connector
A lightweight script to execute Vercel Serverless Edge modules directly from your local terminal.
"""

import argparse
import json
import urllib.request
import urllib.error
import sys
import ssl

def main():
    parser = argparse.ArgumentParser(description="PhoenixCySec Local Worker Integration")
    parser.add_argument("--host", default="http://localhost:3000", help="Vercel/Target Instance URL")
    parser.add_argument("--tool", default="Diagnostic Sync", help="Requested Tool ID")
    parser.add_argument("--url", default="127.0.0.1", help="Target Domain / Subdomain / IP")
    parser.add_argument("--connect-bridge", action="store_true", help="Launch Worker Daemon and generate Sync Token")
    
    args = parser.parse_args()

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    
    api_url = f"{args.host}/api/execute"
    payload = json.dumps({"tool": args.tool, "target": args.url}).encode("utf-8")
    
    try:
        req = urllib.request.Request(
            api_url, 
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "PhoenixCySec-Terminal/1.0"}
        )
    except Exception as e:
        print(f"\n\033[91m[!] Failed to prepare request: {e}\033[0m")
        sys.exit(1) # Exit if request preparation fails
    
    print(f"\033[92m[*] Connecting to Phoenix API Node:\033[0m {args.host}")
    print(f"\033[94m[*] Launching Cloud Engine:\033[0m {args.tool}")
    print(f"\033[93m[*] Target Lock:\033[0m {args.url}\n")
    print("-" * 50)
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            # Stream the server-sent events directly into the console
            for line in response:
                decoded_line = line.decode("utf-8")
                # Add a little color logic for Phoenix outputs
                if "[INFO]" in decoded_line or "[+]" in decoded_line:
                    decoded_line = f"\033[92m{decoded_line}\033[0m"
                elif "[CRITICAL]" in decoded_line or "[-]" in decoded_line:
                    decoded_line = f"\033[91m{decoded_line}\033[0m"
                
                print(decoded_line, end="")
    except urllib.error.URLError as e:
        print(f"\n\033[91m[!] Critical Error: Could not connect to {args.host}\033[0m")
        print(f"Reason: {e.reason}")
    except Exception as e:
        print(f"\n\033[91m[!] Unexpected Backend Collapse: {e}\033[0m")
        
    print("\n" + "-" * 50)
    print("\033[90m> Connection closed.\033[0m")

if __name__ == "__main__":
    main()
