import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from .config import settings


def send_verification_code(to_email: str, code: str, purpose: str) -> None:
    is_register = purpose == "register"
    action = "verify your ApplePoint account" if is_register else "reset your ApplePoint password"
    subject = "Verify your ApplePoint account" if is_register else "Reset your ApplePoint password"
    expiry = max(1, settings.verification_code_seconds // 60)

    plain_body = (
        f"ApplePoint verification code: {code}\n\n"
        f"Use this code to {action}. The code expires in {expiry} minute(s).\n"
        "If you did not request this code, you can safely ignore this email."
    )

    html_body = f"""
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#101114">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:34px 16px;background:#f3f4f6">
          <tr><td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.08)">
              <tr><td style="padding:28px 30px 18px;background:#0b0b0d;color:#ffffff">
                <div style="font-size:22px;font-weight:800;letter-spacing:-.4px">ApplePoint</div>
                <div style="font-size:12px;color:#b9bbc1;margin-top:4px">Accessories • Sales • Repairs</div>
              </td></tr>
              <tr><td style="padding:30px">
                <div style="font-size:24px;font-weight:800;margin-bottom:10px">Your verification code</div>
                <div style="font-size:14px;line-height:1.6;color:#65676d;margin-bottom:24px">Use the code below to {action}. For your security, it expires in <strong>1 minute</strong>.</div>
                <div style="background:#f6f7f9;border:1px solid #e3e5e8;border-radius:16px;padding:18px;text-align:center;font-size:34px;font-weight:900;letter-spacing:10px;color:#111214">{code}</div>
                <div style="font-size:12px;line-height:1.6;color:#8a8d94;margin-top:22px">If you did not request this email, no action is required. Never share this code with anyone.</div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
    """

    mode = settings.email_mode.strip().lower()
    if mode == "console":
        print(f"[APPLEPOINT EMAIL] To: {to_email} | Purpose: {purpose} | Code: {code} | Expires: {settings.verification_code_seconds}s")
        return

    if mode != "smtp":
        raise RuntimeError("EMAIL_MODE must be 'smtp' or 'console'")

    if not all([settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from]):
        raise RuntimeError(
            "SMTP is not fully configured. Set SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM in backend/.env"
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.smtp_from_name, settings.smtp_from))
    msg["To"] = to_email
    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=25) as server:
        server.ehlo()
        if settings.smtp_use_tls:
            server.starttls()
            server.ehlo()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
