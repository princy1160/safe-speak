git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]
NODE_ENV=development
SESSION_SECRET=[any-random-string-for-session-secret]

# Google Calendar API Credentials

GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_CALENDAR_ACCESS_TOKEN=your_access_token_here
GOOGLE_CALENDAR_API_KEY=your_api_key_here
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here

# OTP SMTP Config (Gmail SMTP)

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xyz@gmail.com
SMTP_PASS=your_app_password_here
MASTER_EMAIL=xyz@gmail.com


```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
