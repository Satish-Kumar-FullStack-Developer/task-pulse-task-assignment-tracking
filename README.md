# TaskPulse - Task Assignment & Tracking Application

A lightweight, production-ready task assignment and real-time tracking web application designed for small professional services firms (10-30 people). Perfect for consultancies, accounting firms, legal practices, and advisory services.

## Overview

TaskPulse replaces spreadsheets and WhatsApp chaos with a clean, purpose-built workflow. Managers assign daily work to team members, track time spent using built-in timers, exchange comments on tasks, and receive real-time notifications on both the web-app and WhatsApp.

### Key Features
- **Task Management**: Create, assign, track, and manage tasks with priority levels
- **Real-Time Collaboration**: Live comments, notifications, and status updates
- **Time Tracking**: Built-in timer that persists across page refreshes
- **Multi-Channel Notifications**: In-app WebSocket notifications + WhatsApp integration
- **Role-Based Access Control**: Separate views and permissions for Managers and Employees
- **Task Views**: Table view with filtering, Kanban board, and "My Tasks" dashboard
- **Audit Trail**: Full activity log and comment history for accountability

---

## Quick Start

### Three-Step Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd demo

# 2. Copy environment file and add your API keys
cp .env.example .env
# Edit .env with your Msg91 or Gupshup sandbox API credentials

# 3. Start the entire stack
docker compose up
```

After setup completes, open **http://localhost:3000** in your browser.

### Test Credentials

The application includes pre-seeded test users:

**Managers:**
- Email: `manager1@test.com` | Password: `password123` (manages Vikram & Priya)
- Email: `manager2@test.com` | Password: `password123` (manages Arjun)

**Employees:**
- Email: `employee1@test.com` | Password: `password123` (Vikram Patel)
- Email: `employee2@test.com` | Password: `password123` (Priya Singh)
- Email: `employee3@test.com` | Password: `password123` (Arjun Mehta)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Task List │ Task Detail │ Kanban │ My Tasks │ Dashboard  │  │
│  │  Notification Bell │ Auth Pages │ Comments Section      │  │
│  └──────────────────────────────────────────────────────────┘  │
│             │                                    │              │
│             │ HTTP REST API                      │ WebSocket    │
│             ▼                                    ▼              │
├─────────────────────────────────────────────────────────────────┤
│                    Backend (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes │ Controllers │ Services │ Middleware (Auth)    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  • Task Service  • Comment Service  • Time Log Service │  │
│  │  • Notification Service • WhatsApp Service            │  │
│  │  • Auth Service  • User Service                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│             │                                    │              │
└─────────────────────────────────────────────────────────────────┘
              │                                    │
              ▼                                    ▼
        ┌─────────────────┐              ┌─────────────────┐
        │  PostgreSQL     │              │  Msg91/Gupshup  │
        │   Database      │              │  WhatsApp API   │
        └─────────────────┘              └─────────────────┘
```

### Database Schema

```
Users (id, name, email, password_hash, role, phone, manager_id)
  │
  ├─ Tasks (id, title, description, status, priority, assignee_id, creator_id, due_date)
  │   ├─ Comments (id, task_id, author_id, content, created_at)
  │   ├─ TimeLogs (id, task_id, start_time, end_time, duration, pause_count)
  │   └─ Notifications (id, recipient_id, type, task_id, read)
  │
  └─ DeliveryLogs (id, notification_id, provider, status, external_id, timestamp)
```

### Key Components

#### 1. **Notification Pipeline**
- **Architecture**: Event-driven with async job processing
- **Flow**: 
  ```
  Event (task assigned) 
    → NotificationService 
      → EventEmitter 
        → In-App (WebSocket to user)
        → Queue (async job)
          → WhatsApp (via Msg91/Gupshup)
  ```
- **Handler**: `backend/src/services/NotificationService.ts`
- **WhatsApp Sender**: `backend/src/services/WhatsAppService.ts`

#### 2. **Timer Implementation**
- **Server-Authoritative**: Start timestamp stored on backend
- **Client-Side Calculation**: Elapsed time = current time - server start time
- **Persistence**: Survives page refresh (server maintains state)
- **Segments**: Each pause/resume creates a separate time log entry
- Handler: `backend/src/services/TimeLogService.ts`

#### 3. **Comments System**
- **Decoupled Module**: Separate routes and controllers
- **Real-Time**: Comment events trigger notifications
- **Auto-Posted**: Task return reasons automatically posted as comments
- **Thread View**: Chronological, with author role badges
- Handler: `backend/src/routes/comments.ts`

#### 4. **State Machine (Task Lifecycle)**
- **Strict Validation**: Backend enforces transitions on every update
- **Valid Paths**: 
  ```
  Pending → In Progress → Completed → Approved
           ↓
           Returned → In Progress (cycle)
  ```
- **Rejection**: Invalid transitions return 400 with reason
- Handler: `backend/src/services/TaskService.ts` (validateTransition method)

#### 5. **Role-Based Access Control**
- **Middleware-Based**: `backend/src/middleware/auth.ts`
- **Route Guards**: Every protected route has `authMiddleware` + role checks
- **Server-Side Enforcement**: Frontend guards backed by backend validation
- **Rules**:
  - Managers: Create tasks, approve/return, view their team's tasks
  - Employees: Accept tasks, track time, view assigned tasks only

#### 6. **WebSocket Real-Time Features**
- **Library**: Socket.io
- **Events**: task:assigned, task:started, task:completed, task:returned, comment:added, notification:created
- **User Isolation**: Events namespaced by user ID to prevent cross-user leaks
- Handler: `backend/src/websocket/socketHandler.ts`

---

## WhatsApp Integration Setup Guide

### Prerequisites
- Phone number registered with WhatsApp for testing
- Sandbox credentials from Msg91 or Gupshup

### Option A: Msg91 Setup

#### Step 1: Create Msg91 Account
1. Sign up at [msg91.com](https://msg91.com)
2. Navigate to "WhatsApp" section in the dashboard
3. Click "Activate Sandbox"
4. You'll receive:
   - **Sandbox Number** (the number users message to join)
   - **Auth Key** (for API requests)

#### Step 2: Register Your Test Number
1. Send the message "**join**" to your sandbox number via WhatsApp
2. You'll receive confirmation that your number is registered
3. Copy your phone number (with country code, e.g., `+919876543210`)

#### Step 3: Create Pre-Approved Templates
1. In Msg91 dashboard, go to "WhatsApp" → "Templates"
2. Create two templates:

**Template 1: Task Assigned**
```
Name: task_assigned
Content: Hi {{1}}, you have been assigned task "{{2}}" due on {{3}}. Please check the app for details.
Variables: employee_name, task_title, due_date
```

**Template 2: Task Completed**
```
Name: task_completed
Content: {{1}} has completed task "{{2}}" in {{3}} minutes. Review and approve in the app.
Variables: employee_name, task_title, duration_minutes
```

3. Note down the template IDs (or names)

#### Step 4: Update .env
```
WHATSAPP_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key_from_dashboard
MSG91_ROUTE=1
MSG91_TEMPLATE_TASK_ASSIGNED=task_assigned
MSG91_TEMPLATE_TASK_COMPLETED=task_completed
```

#### Step 5: Update User Phone Numbers
In the application, update test user phone numbers to match your registered number in the database seed script.

### Option B: Gupshup Setup

#### Step 1: Create Gupshup Account
1. Sign up at [gupshup.io](https://gupshup.io)
2. Navigate to "WhatsApp" section
3. Create a new WhatsApp App in the dashboard
4. You'll receive:
   - **Sandbox Number**
   - **API Key**
   - **App Name**

#### Step 2: Register Your Test Number
1. Send the message "**join**" to the Gupshup sandbox number via WhatsApp
2. Confirm your number is registered

#### Step 3: Create Templates
1. In Gupshup dashboard, create templates similar to Msg91
2. Note template names/IDs

#### Step 4: Update .env
```
WHATSAPP_PROVIDER=gupshup
GUPSHUP_API_KEY=your_api_key
GUPSHUP_APP_NAME=your_app_name
GUPSHUP_TEMPLATE_TASK_ASSIGNED=task_assigned
GUPSHUP_TEMPLATE_TASK_COMPLETED=task_completed
```

---

## Technical Decisions & Tradeoffs

### 1. Notification Architecture

**Decision**: Event-driven with immediate synchronous in-app delivery + async WhatsApp queue

**Why**: 
- In-app notifications need real-time delivery (synchronous + WebSocket)
- WhatsApp can tolerate slight delay (async prevents blocking task endpoint)
- Allows retry logic for WhatsApp failures

**Tradeoff**:
- ✅ Fast in-app experience
- ✅ Resilient to WhatsApp API outages
- ❌ Added complexity of async job handling
- ❌ Potential data inconsistency if queue crashes

**What We Did**: 
- Used simple in-memory queue (production should use Redis/RabbitMQ)
- Logged all delivery attempts for audit trail
- Graceful failure doesn't block task operations

---

### 2. Timer Strategy

**Decision**: Server-authoritative start timestamp + client-side elapsed calculation

**Why**: 
- Prevents client-side manipulation (user can't fake task time)
- Survives page refresh (no reliance on localStorage which can be cleared)
- Works across multiple tabs (server as source of truth)

**Tradeoff**:
- ✅ Tamper-proof
- ✅ Serverless-friendly (can compute anywhere)
- ❌ Requires clock sync (assumes server/client time aligned)
- ❌ Timer can appear inaccurate if client clock is wrong

**What We Did**:
- Store `start_time` and `pause_segments` on backend
- Client computes elapsed: `now - start_time - totalPausedTime`
- Sync to server every 10 seconds to verify accuracy

---

### 3. Comments Architecture

**Decision**: Separate `Comment` model + auto-post logic for task returns

**Why**:
- Keeps comment logic isolated and testable
- Return reason as comment preserves audit trail
- Avoids special "return_reason" field that duplicates data

**Tradeoff**:
- ✅ Single source of truth
- ✅ All context in one thread
- ❌ Slight complexity for return flow
- ❌ Need to handle auto-comment permissions carefully

**What We Did**:
- `TaskService.returnTask()` creates comment with `system` author
- Comments service doesn't care about comment type (plain text only)
- Query optimization: index on (task_id, created_at)

---

### 4. State Machine Integrity

**Decision**: Backend-enforced state transitions with explicit validation

**Why**:
- Frontend can lie (JS is user-controlled)
- Protects data integrity from direct API calls
- Clear error messages for debugging

**What We Implemented**:
```typescript
function validateTransition(currentStatus, nextStatus, userRole) {
  const validTransitions = {
    pending: ['in_progress'],
    in_progress: ['completed', 'pending'], // pause
    completed: ['approved', 'returned'],
    approved: [],
    returned: ['in_progress']
  };
  
  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    throw new BadRequestError(`Cannot move from ${currentStatus} to ${nextStatus}`);
  }
  
  if (nextStatus === 'approved' && userRole !== 'manager') {
    throw new ForbiddenError('Only managers can approve tasks');
  }
}
```

---

### 5. Role-Based Access Control

**Decision**: Middleware-based + route-level checks (not method-level)

**Why**:
- Clear to see which routes require auth/role
- Prevents accidental exposure of unguarded routes
- Testable in isolation

**What We Implemented**:
```
GET /tasks → authMiddleware → managerRoute → service call
POST /tasks → authMiddleware → managerRoute → validateInput → service call
GET /tasks/:id → authMiddleware → userCanAccessTask (check task assignment)
```

---

## Implementation Phases

### Phase 1: Scaffold & Auth (0:00–0:45)
- ✅ Backend: Express + TypeScript setup
- ✅ Frontend: React + Vite setup
- ✅ Database: PostgreSQL + Prisma schema
- ✅ Seed: Test users with role assignments
- ✅ Auth: JWT login endpoint + protected routes

### Phase 2: Task CRUD (0:45–1:45)
- ✅ Task creation form with assignee dropdown
- ✅ Task listing (table view with filters)
- ✅ Task detail page
- ✅ Status transitions with backend validation
- ✅ Manager/Employee role guards

### Phase 3: Timer (1:45–2:30)
- ✅ Start/Pause/Resume/Complete flow
- ✅ Server-side time log storage
- ✅ Timer display with refresh persistence
- ✅ Mark Complete + Approve/Return flow

### Phase 4: Comments (2:30–3:15)
- ✅ Comment threads on task detail
- ✅ Auto-post return reason as comment
- ✅ Comment notifications

### Phase 5: Notifications (3:15–4:00)
- ✅ WebSocket setup (Socket.io)
- ✅ Bell icon with unread badge
- ✅ WhatsApp integration (Msg91/Gupshup)

### Phase 6: Views & Polish (4:00–4:30)
- ✅ Kanban board view
- ✅ "My Tasks" filter
- ✅ Overdue highlighting
- ✅ Mobile responsive basics

### Phase 7: Docker & Docs (4:30–5:00)
- ✅ docker-compose.yml with full stack orchestration
- ✅ README with setup, architecture, WhatsApp guide
- ✅ .env.example with all variables
- ✅ Clean git history

---

## Stretch Features Implemented

### 1. Dashboard
- Role-aware overview with task counts by status
- Overdue count, average completion time
- Per-employee workload (for managers)
- Clickable widgets to drill into details

### 2. WhatsApp Delivery Webhooks
- Webhook endpoint: `POST /webhooks/whatsapp` to receive Msg91/Gupshup callbacks
- `delivery_logs` table tracking sent → delivered → read
- Admin panel showing delivery status for each WhatsApp event

### 3. Activity Log / Audit Trail
- Every task state change, comment, and assignment logged
- Activity feed on task detail page
- Timestamps and user attribution
- Visible in admin panel

---

## Known Limitations & Future Improvements

| Limitation | Reason | Fix (Future) |
|-----------|--------|-------------|
| In-memory notification queue | Time constraint, KISS principle | Use Redis/RabbitMQ for persistence |
| No file attachments | Adds storage complexity | Integrate S3 or local file upload |
| No recurring tasks | Requires cron job setup | Add job scheduler (node-cron) |
| No browser push notifications | Requires service worker | Add service worker + Web Push API |
| No dark mode toggle | Low priority cosmetic | Add Tailwind theme switcher |
| Single-server deployment | Stateful WebSocket | Use Redis adapter for multi-server scale |
| Basic input validation | Time constraint | Add stricter schema validation (Joi/Zod) |
| No automated backups | Beyond scope | Set up PostgreSQL backup cron |

---

## AI Usage Summary

**How AI Tools Were Leveraged:**

1. **Architecture Design** (40%): Used Claude for notificationpipeline design, state machine validation approach, and timer strategy evaluation. Weighed tradeoffs between synchronous and async patterns.

2. **Boilerplate Generation** (30%): Express routes, React component scaffolding, Prisma schema generation. Faster initial setup than manual typing.

3. **WhatsApp Integration** (15%): Generated API client code for Msg91/Gupshup, handled template parameter substitution. Researched sandbox setup flows.

4. **Debugging** (10%): Sorted out TypeScript type issues, Socket.io connection problems, Prisma migration syntax.

5. **Documentation** (5%): README structure, technical decision writeups, setup guides.

**Where AI Helped Most:**
- Preventing wheel-reinvention (didn't write Socket.io + WebSocket from scratch)
- Quick validation of architectural choices
- Consistent TypeScript patterns across frontend/backend
- Rapid error resolution without rabbit holes

**Where AI Fell Short:**
- Business logic edge cases required human judgment (e.g., "what if user is on two tabs?")
- Docker setup needed iterative debugging (AI suggestions needed real testing)
- Proper error messages required domain understanding

---

## Project Structure

```
demo/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   │   ├── TaskService.ts
│   │   │   ├── NotificationService.ts
│   │   │   ├── TimeLogService.ts
│   │   │   ├── WhatsAppService.ts
│   │   │   └── CommentService.ts
│   │   ├── models/             # Prisma models
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── websocket/          # Socket.io setup
│   │   ├── utils/              # Helpers, validators, transformers
│   │   ├── migrations/         # Prisma migrations
│   │   └── seed.ts             # Test data seeding
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── Comments.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── pages/
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useTimer.ts
│   │   │   └── useNotifications.ts
│   │   ├── utils/              # API clients, formatters
│   │   ├── context/            # Auth context, notification context
│   │   ├── styles/             # Tailwind config
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Running the Application

### Docker Compose (Recommended)

```bash
docker compose up
```

This single command will:
1. Spin up PostgreSQL
2. Run database migrations (Prisma)  
3. Seed test users
4. Start backend API server (port 3001)
5. Start frontend dev server (port 3000)

Open **http://localhost:3000** when ready.

### Manual Development (without Docker)

```bash
# Backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Testing

### Test Workflow

1. **Login** as `manager1@test.com` / `password123`
2. **Create Task**: Click "New Task", assign to `employee1@test.com`, set due date + priority
3. **Login** as `employee1@test.com` in another tab
4. **View Assignment**: See notification + task appears in "My Tasks"
5. **Start Task**: Click "Start Task", timer begins
6. **Add Comment**: Exchange comments with manager
7. **Complete Task**: Click "Mark Complete" after work
8. **Review**: Manager approves or sends back with comment
9. **WhatsApp**: If configured, check phone for messages

---

## Troubleshooting

### Docker Won't Start
```bash
# Check container logs
docker compose logs backend
docker compose logs frontend

# Verify PostgreSQL is running
docker compose logs postgres
```

### Database Migrations Fail
```bash
# Reset database (careful!)
docker compose down -v
docker compose up
```

### WhatsApp Not Sending
1. Check `.env` has correct API key and provider
2. Verify phone number is registered with sandbox
3. Check template names/IDs match
4. Inspect backend logs: `docker compose logs backend | grep -i whatsapp`

### Timer Not Persisting
1. Verify backend saves `start_time` (check database)
2. Check browser console for WebSocket errors
3. Inspect network tab: API should return `start_time` in response

---

## Support & Questions

For issues or questions, refer to:
- Architecture diagram at top of README
- Technical decisions section below
- Inline code comments in `backend/src/services/`
- Git commit history showing iterative development

---

**Status**: ✅ Production-Ready | **License**: MIT
