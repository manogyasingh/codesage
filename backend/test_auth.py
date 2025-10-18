#!/usr/bin/env python3
"""
Test script to check authentication and create test user if needed
"""

from app.db.session import get_db
from app.models import CompanyUser, Company
from app.core.security import hash_password, verify_password
import uuid

def main():
    db = next(get_db())
    
    # Check existing users
    print("=== Existing Users ===")
    users = db.query(CompanyUser).all()
    for user in users:
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"Company ID: {user.company_id}")
        print(f"First name: {user.first_name}")
        print(f"Last name: {user.last_name}")
        print(f"Password hash: {user.password_hash[:30]}...")
        print(f"Is active: {user.is_active}")
        print("-" * 50)
    
    # Try to find admin user
    admin_user = db.query(CompanyUser).filter(CompanyUser.email == "admin@example.com").first()
    
    if admin_user:
        print("\n=== Testing Password ===")
        test_passwords = ["admin123", "password", "test123", "123456", "admin"]
        
        for pwd in test_passwords:
            if verify_password(pwd, admin_user.password_hash):
                print(f"✅ Password '{pwd}' works!")
                break
            else:
                print(f"❌ Password '{pwd}' doesn't work")
        else:
            print("\n⚠️  None of the test passwords work. Setting password to 'admin123'...")
            admin_user.password_hash = hash_password("admin123")
            db.commit()
            
            # Verify it works now
            if verify_password("admin123", admin_user.password_hash):
                print("✅ Password 'admin123' set successfully!")
            else:
                print("❌ Failed to set password")
    else:
        print("\n⚠️  No admin user found. Creating one...")
        
        # Check if we have a company
        company = db.query(Company).first()
        if not company:
            print("Creating company...")
            company = Company(
                id=str(uuid.uuid4()),
                name="Test Company",
                email="company@example.com"
            )
            db.add(company)
            db.commit()
        
        # Create admin user
        admin_user = CompanyUser(
            id=str(uuid.uuid4()),
            company_id=company.id,
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            password_hash=hash_password("admin123"),
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Admin user created successfully!")
    
    db.close()

if __name__ == "__main__":
    main()