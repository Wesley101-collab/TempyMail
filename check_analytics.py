import sqlite3
db = sqlite3.connect('/var/www/TempyMail/backend/emails.db')
rows = db.execute("SELECT event, value, created_at FROM analytics WHERE event='account_created' ORDER BY created_at DESC LIMIT 10").fetchall()
for r in rows:
    print(r)
db.close()
