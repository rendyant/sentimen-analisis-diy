from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

async def send_email(to: str, subject: str, body: str) -> None:
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        # TODO: ganti ke proper logging (misal `logging` module) kalau sudah production
        print(f"[EMAIL GAGAL] Tujuan: {to}, Error: {e}")