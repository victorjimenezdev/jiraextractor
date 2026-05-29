import os
import urllib.request
import urllib.error
import json
import base64
import sys

# Get credentials from env
BASE_URL = os.environ.get('JIRA_BASE_URL')
EMAIL = os.environ.get('JIRA_EMAIL')
TOKEN = os.environ.get('JIRA_API_TOKEN')

if not all([BASE_URL, EMAIL, TOKEN]):
    print("Missing credentials in environment variables")
    sys.exit(1)

auth_str = f"{EMAIL}:{TOKEN}"
b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
headers = {
    "Authorization": f"Basic {b64_auth}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# Fetch specific issue
issue_key = "ACCWM-62"
issue_url = f"{BASE_URL}/rest/api/3/issue/{issue_key}"

print(f"Fetching issue: {issue_url}")

req = urllib.request.Request(issue_url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.load(response)
        fields = data.get('fields', {})
        
        # TARGET FIELD: QA Bugs
        field_id = 'customfield_10207'
        qa_bugs = fields.get(field_id)
        
        print(f"\n--- VALUE FOR [{field_id}] (QA Bugs) ---")
        print(json.dumps(qa_bugs, indent=2))
        print("------------------------------------------\n")

except urllib.error.HTTPError as e:
    print(f"API Error: {e.code} {e.reason}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
