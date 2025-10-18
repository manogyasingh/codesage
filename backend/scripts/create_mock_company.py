#!/usr/bin/env python3
"""
Create mock company and admin user for testing
"""
import os
import sys
import uuid

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from app.models import Company, CompanyUser
from app.core.security import get_password_hash

def create_mock_company():
    """Create a mock company with admin user"""
    db = next(get_db())
    
    try:
        # Check if company already exists
        existing_company = db.query(Company).filter(Company.email == "company@example.com").first()
        if existing_company:
            print("✅ Mock company already exists!")
            # Check if admin user exists
            existing_admin = db.query(CompanyUser).filter(CompanyUser.email == "admin@example.com").first()
            if existing_admin:
                print("✅ Mock admin user already exists!")
                print(f"📧 Company Email: company@example.com")
                print(f"👤 Admin Email: admin@example.com")
                print(f"🔑 Password: password123")
                return True
            else:
                # Create only the admin user
                print("👤 Creating admin user...")
                admin_user_id = str(uuid.uuid4())
                admin_user = CompanyUser(
                    id=admin_user_id,
                    company_id=existing_company.id,
                    email="admin@example.com",
                    first_name="Admin",
                    last_name="User",
                    role="admin",
                    permissions={
                        "can_create_problems": True,
                        "can_edit_problems": True,
                        "can_delete_problems": True,
                        "can_manage_users": True,
                        "can_view_analytics": True,
                        "can_conduct_interviews": True,
                        "can_export_data": True
                    },
                    is_active=True,
                    password_hash=get_password_hash("password123")
                )
                db.add(admin_user)
                db.commit()
                print("🎉 Admin user created successfully!")
                print(f"📧 Company Email: company@example.com")
                print(f"👤 Admin Email: admin@example.com")
                print(f"🔑 Password: password123")
                return True
        
        # Create company
        company_id = str(uuid.uuid4())
        company = Company(
            id=company_id,
            name="Example Company",
            email="company@example.com",
            industry="Technology",
            size="startup",
            description="A mock company for testing the CodeSage interview platform",
            subscription_plan="free",
            is_active=True,
            settings={
                "max_concurrent_interviews": 5,
                "max_problems": 100,
                "max_candidates_per_month": 100,
                "allowed_programming_languages": ["python", "javascript", "typescript", "java", "go"],
                "custom_branding": True,
                "api_access": True
            }
        )
        
        db.add(company)
        db.flush()  # Flush to get the company created before creating user
        
        # Create admin user
        admin_user_id = str(uuid.uuid4())
        admin_user = CompanyUser(
            id=admin_user_id,
            company_id=company_id,
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            permissions={
                "can_create_problems": True,
                "can_edit_problems": True,
                "can_delete_problems": True,
                "can_manage_users": True,
                "can_view_analytics": True,
                "can_conduct_interviews": True,
                "can_export_data": True
            },
            is_active=True,
            password_hash=get_password_hash("password123")
        )
        
        db.add(admin_user)
        db.commit()
        
        print("🎉 Mock company and admin user created successfully!")
        print("📋 Login Credentials:")
        print(f"📧 Company Email: company@example.com")
        print(f"👤 Admin Email: admin@example.com")
        print(f"🔑 Password: password123")
        print("\n🚀 You can now log in to the Company Portal!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating mock company: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🏢 Creating Mock Company for Testing...")
    success = create_mock_company()
    if not success:
        sys.exit(1)