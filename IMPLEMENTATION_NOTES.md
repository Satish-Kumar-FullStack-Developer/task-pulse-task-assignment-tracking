# TaskPulse Implementation Notes

## Development Overview

This document details key implementation decisions and technical insights for the TaskPulse task management system.

## Architecture Highlights

### Notification System (Most Complex)

The notification system is designed as an event-driven pipeline that fans out to multiple channels:

**Design Pattern:**
```typescript
async function notifyTaskAssigned(task) {
  // 1. Create in-app notification (immediate)
  const notification = await Notification.create({
    type: 'TASK_ASSIGNED',
    recipientId: task.assigneeId,
    message: `Task assigned: ${task.title}`
  });
  
  // 2. Emit WebSocket to connected user (immediate)
  io.to(task.assigneeId).emit('notification:created', {
    id: notification.id,
    type: 'TASK_ASSIGNED',
    message: notification.message
  });
  
  // 3. Queue WhatsApp delivery (async, non-blocking)
  NotificationQueue.add({ notificationId, ... });
}
```

**Why:** In-app instant, WhatsApp can retry, server stays responsive to task operations.

### Timer Implementation (Server-Authoritative)

Server stores startTime, client computes elapsed. Prevents manipulation via client-side storage.

### State Machine Validation

Backend always validates transitions. Invalid transitions rejected with clear errors.

### Comments as Collaborative History

- Discussion channel for manager + employee
- Audit trail (return reasons auto-posted)
- Permissions: only creator/assignee can comment
- XSS prevention via HTML escaping

### WebSocket Real-Time Updates

- Socket.io with user rooms for isolation
- Scalable with Redis adapter
- Immediate updates to connected users

## Database Design

### Team Structure
```
Manager → manages → [Employees]
Users linked via managerId field
```

### Permissions Model
```
Can access task if:
  creatorId = userId OR assigneeId = userId
Only managers can create/approve tasks
Only employees can implement/update time
```

### Indexed Hot Paths
- `Task(assigneeId)` - list my tasks
- `Notification(recipientId)` - my notifications  
- `Comment(taskId)` - task comments
- `TimeLog(taskId)` - task time spent

## Security

- JWT tokens with expiration
- Password hashed with bcrypt
- Input sanitized (XSS prevention)
- Permissions enforced on backend
- No sensitive data in logs

## Performance

- Eager loading for related data (no N+1)
- Indexed queries for common filters
- WebSocket for real-time (no polling)
- Efficient pagination

## Testing

Recommended flow:
1. Manager creates task, assigns to employee
2. Employee receives notification
3. Employee starts timer (timer persists on refresh)
4. Employee pauses timer
5. Manager reviews in real-time
6. Employee marks complete
7. Manager approves with comment
8. Full audit trail visible

## Known Limitations

- In-memory queue (single server only)
- No file attachments
- No recurring tasks
- Basic validation

## Future Improvements

- Redis for queue persistence
- S3 for file storage
- Job scheduler for recurring
- Advanced validation (Zod/Joi)
- Rate limiting
