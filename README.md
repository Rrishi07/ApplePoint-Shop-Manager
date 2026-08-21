# ApplePoint Shop Manager — Python + React + Firebase Authentication

This version keeps the ApplePoint shop system on **React + FastAPI/Python**, but removes Gmail SMTP completely.

## Authentication in this version

- Users enter their **own email and password** on the ApplePoint registration screen.
- The React app sends them to the **FastAPI backend**.
- FastAPI creates/authenticates the account through **Firebase Authentication**.
- Firebase sends the verification email directly. You do **not** enter a Gmail sender account, Gmail password, Google App Password, or enable Gmail 2-Step Verification for SMTP.
- The user clicks the Firebase verification link in their inbox.
- ApplePoint login checks Firebase and refuses access until `emailVerified=true`.
- Forgot Password sends Firebase's secure password-reset email.
- After verified login, FastAPI issues the ApplePoint JWT used by Inventory, Repairs, Dashboard, Reports and Backup.

> This intentionally replaces the old custom 6-digit Gmail-SMTP code with Firebase's verification link. That removes the 535 Gmail credential problem entirely.

## 1. Firebase setup (once)

Use your existing Firebase project or create one.

1. Open Firebase Console.
2. Select your ApplePoint project.
3. Go to **Build -> Authentication**.
4. Click **Get started** if needed.
5. Open **Sign-in method**.
6. Enable **Email/Password**.
7. Go to **Project settings -> General**.
8. Copy the project's **Web API Key**.

For deployment, also add your final website domain under Firebase Authentication **Settings -> Authorized domains**.

## 2. Backend setup

Use Python 3.11.

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Set these two values:

```env
SECRET_KEY=YOUR_RANDOM_SECRET
FIREBASE_WEB_API_KEY=YOUR_FIREBASE_WEB_API_KEY
```

Generate `SECRET_KEY` with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Start backend:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs:

`http://127.0.0.1:8000/docs`

## 3. Frontend setup

Open another PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open:

`http://localhost:5173`

## 4. Registration test

1. Open **Create account**.
2. Enter your own real email.
3. Enter a password (minimum 8 characters in ApplePoint UI).
4. Click **Create account**.
5. Check Inbox/Spam for Firebase's verification email.
6. Click the verification link.
7. Return to ApplePoint and sign in with the same email/password.

No Gmail SMTP values are needed anywhere in `.env`.

## Existing shop features

- Dashboard and stock warnings
- Inventory/accessory catalog
- Sell action with automatic stock deduction
- Repair intake and statuses
- Daily reporting and PDF/PNG export
- Backup/restore
- Responsive React UI using the ApplePoint logo
