import requests
import json

# Your webhook URL
url = 'https://hooks.zapier.com/hooks/catch/27437506/4yk5gd0/'

# Test payload with all required fields
payload = {
    "stage": "paid",
    "source": "stablesvc-website",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St",
    "city": "Denver",
    "fullAddress": "123 Main St, Denver, CO",
    "serviceLabel": "Pool Service",
    "planLabel": "Stable Standard",
    "planPrice": "$129.99/mo",
    "service": "pool",
    "plan": "standard",
    "preferredDate": "2025-06-15",
    "timeWindow": "9am-12pm",
    "weeklyDay": "Monday",
    "poolSize": "15x30",
    "poolType": "In-ground",
    "lawnSize": "0.5 acres",
    "pressureArea": "2000 sqft",
    "preferredContact": "Email",
    "confirmationId": "CONF-2025-001",
    "bookingId": "BOOK-2025-12345",
    "submittedAt": "2025-06-01T14:30:00Z",
    "notes": "Customer has pets and prefers evening appointments"
}

# Send POST request
try:
    response = requests.post(url, json=payload)
    
    # Print the response
    print("✅ Request sent successfully!")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"❌ Error sending request: {e}")