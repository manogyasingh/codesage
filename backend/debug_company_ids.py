from app.models.user import CompanyUser
from app.models.interview import InterviewSession
from app.db.session import SessionLocal

db = SessionLocal()
try:
    user = db.query(CompanyUser).first()
    interview = db.query(InterviewSession).first()
    
    print('User company_id:')
    print(f'  Value: "{user.company_id}"')
    print(f'  Type: {type(user.company_id)}')
    
    print('Interview company_id:')
    print(f'  Value: "{interview.company_id}"')
    print(f'  Type: {type(interview.company_id)}')
    
    print(f'Are they equal? {user.company_id == interview.company_id}')
    print(f'String comparison: {str(user.company_id) == str(interview.company_id)}')
finally:
    db.close()