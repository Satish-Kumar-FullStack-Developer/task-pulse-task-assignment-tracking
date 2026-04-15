# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 3001, 5432 available
- Optional: Msg91 or Gupshup WhatsApp sandbox account

## Three-Step Setup

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd demo
```

### 2. Configure Environment
```bash
cp .env.example .env

# Optional: Add WhatsApp credentials
# WHATSAPP_PROVIDER=msg91
# MSG91_AUTH_KEY=your_key_here
```

### 3. Start Application
```bash
docker compose up
```

**Wait for:** `Backend running on http://localhost:3001`

## Access Application

Open **http://localhost:3000**

### Test Credentials

Manager:
```
Email: manager1@test.com
Password: password123
```

Employee:
```
Email: employee1@test.com
Password: password123
```

## First Actions

### As Manager:
1. Click "New Task"
2. Fill: Title, Description, Assign to employee, Due date, Priority
3. Click "Create Task"
4. See task appear in list

### As Employee:
1. See task in "My Tasks"
2. Click "View"
3. Click "Start Task"
4. Timer begins
5. Add a comment
6. Click "Mark Complete"
7. Manager receives notification

## Troubleshooting

### Ports already in use
```bash
# Change ports in docker-compose.yml
# Or kill existing processes:
lsof -i :3000  # Find PID
kill -9 <PID>
```

### Database won't start
```bash
docker compose down -v  # Remove volumes
docker compose up       # Fresh start
```

### Authentication fails
- Verify credentials in test users
- Check database seed completed: `docker compose logs backend | grep seed`

### WhatsApp not sending
- Verify provider configured in .env
- Check credentials are correct
- Ensure phone number is registered with sandbox
- Review backend logs: `docker compose logs backend | grep -i whatsapp`

## Next Steps

1. **Explore UI:**
   - Create tasks with different priorities
   - Track time spent
   - Leave comments
   - Review notifications

2. **Test Workflows:**
   - Manager assigns → Employee gets notification
   - Employee starts timer → Manager sees in real-time
   - Employee completes → Manager approves/returns
   - Comments trigger notifications

3. **WhatsApp Integration** (Optional):
   - Set up Msg91/Gupshup sandbox
   - Configure credentials in .env
   - Test WhatsApp notifications

## Documentation

- **Architecture:** See [README.md](README.md#architecture)
- **WhatsApp Setup:** See [README.md](README.md#whatsapp-integration-setup-guide)
- **Technical Details:** See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)
- **Deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Support

Check application logs:
```bash
docker compose logs backend -f    # Backend logs
docker compose logs frontend -f   # Frontend logs
docker compose logs postgres -f   # Database logs
```

Browser console: Press F12 in browser for frontend errors.
