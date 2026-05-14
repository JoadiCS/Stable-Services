import requests
import json

# Your webhook URL
url = 'https://hooks.zapier.com/hooks/catch/27437506/4yk5gd0/'

# Test payload with all fields including new ones for multiple lead types
payload = {
    "stage": "commercial",
    "source": "stablesvc-website",
    "firstName": "Jane",
    "lastName": "Smith",
    "fullName": "Jane Smith",
    "email": "jane@business.com",
    "phone": "555-987-6543",
    "address": "456 Business Ave",
    "city": "Phoenix",
    "fullAddress": "456 Business Ave, Phoenix, AZ",
    "serviceLabel": "Commercial Cleaning",
    "planLabel": "Enterprise",
    "planPrice": "$2,499/mo",
    "service": "commercial",
    "plan": "enterprise",
    "preferredDate": "2025-06-20",
    "timeWindow": "after 5pm",
    "weeklyDay": "Wednesday",
    "poolSize": "",
    "poolType": "",
    "lawnSize": "",
    "pressureArea": "",
    "businessName": "Smith Property Management Inc",
    "businessRole": "Operations Director",
    "propertyType": "Commercial Office Complex",
    "servicesInterested": "Floor waxing, carpet cleaning, window washing",
    "repairCategory": "",
    "urgency": "",
    "description": "",
    "preferredContact": "Phone call",
    "confirmationId": "CONF-2025-002",
    "bookingId": "BOOK-2025-54321",
    "submittedAt": "2025-06-01T16:45:00Z",
    "notes": "Property has 15 floors, bulk discount negotiable"
}

# Send POST request
try:
    print("🚀 Sending test data to webhook...")
    response = requests.post(url, json=payload)
    
    # Print the response
    print("\n✅ Request sent successfully!")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n🎉 Test data received! Now go back to Zapier and test Step 3.")
    else:
        print("\n⚠️  Check the status code above.")
    
except Exception as e:
    print(f"\n❌ Error sending request: {e}")