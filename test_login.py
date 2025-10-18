#!/usr/bin/env python3

import requests
import json

def login_and_get_token():
    # Login with the test credentials
    login_data = {
        'username': 'admin@example.com',  # FastAPI OAuth2 uses 'username' field
        'password': 'password123'
    }
    
    try:
        # Make login request
        response = requests.post('http://localhost:8000/auth/login', data=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            print(f"Login successful!")
            print(f"Access Token: {token}")
            
            # Save token to file for easy access
            with open('.token', 'w') as f:
                f.write(token)
            print("Token saved to .token file")
            
            # Test the token by getting user info
            headers = {'Authorization': f'Bearer {token}'}
            user_response = requests.get('http://localhost:8000/users/me', headers=headers)
            
            if user_response.status_code == 200:
                user_data = user_response.json()
                print(f"User info: {json.dumps(user_data, indent=2)}")
                
                # Test problems endpoint
                problems_response = requests.get('http://localhost:8000/problems/', headers=headers)
                if problems_response.status_code == 200:
                    problems_data = problems_response.json()
                    print(f"Problems count: {len(problems_data)}")
                    if problems_data:
                        print("First problem:", json.dumps(problems_data[0], indent=2, default=str))
                else:
                    print(f"Problems request failed: {problems_response.status_code} - {problems_response.text}")
            else:
                print(f"User info request failed: {user_response.status_code} - {user_response.text}")
                
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    login_and_get_token()