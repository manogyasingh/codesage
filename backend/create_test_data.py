import json

# Create test data
test_data = {
    "id": "simple-test-id",
    "email": "api-test@example.com", 
    "first_name": "API",
    "last_name": "Test"
}

# Save to file for curl
with open("test_candidate.json", "w") as f:
    json.dump(test_data, f)

print("Test data saved to test_candidate.json")
print("JSON content:", json.dumps(test_data, indent=2))