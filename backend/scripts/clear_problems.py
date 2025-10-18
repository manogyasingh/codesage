#!/usr/bin/env python3

from app.db.session import get_db
from app.models import Problem

def clear_problems():
    db = next(get_db())
    try:
        print('Clearing existing problems...')
        deleted_count = db.query(Problem).delete()
        db.commit()
        print(f'Successfully cleared {deleted_count} problems from database')
    except Exception as e:
        print(f'Error clearing problems: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_problems()