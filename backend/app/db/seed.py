from app.core.security import get_password_hash
from app.db.opd import OPD_DATA
from app.db.session import SessionLocal
from app.models.opd import OPD
from app.models.user import User, UserRole, UserStatus

def seed_opd(db):
    created = 0
    for opd_data in OPD_DATA:
        exists = db.query(OPD).filter(OPD.name == opd_data["name"]).first()
        if not exists:
            db.add(OPD(name=opd_data["name"], slug=opd_data["slug"]))
            created += 1

    db.commit()
    print(f"OPD baru ditambahkan: {created}")

def seed_admin(db):
    admin_email = "rendyant2305@gmail.com"

    exists = db.query(User).filter(User.email == admin_email).first()
    if exists:
        print("Admin sudah ada, dilewati")
        return

    admin = User(
        full_name="Admin Diskominfo DIY",
        email=admin_email,
        hashed_password=get_password_hash("Rtono2305"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )

    db.add(admin)
    db.commit()
    print(f"Admin dibuat: {admin_email} (segera ganti passwordnya setelah login pertama)")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_opd(db)
        seed_admin(db)
    finally:
        db.close()