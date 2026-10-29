import { Router } from 'express';
import { createCalendarEventSchema, type CalendarEvent } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireFlatMembership } from '../middleware/flat-member.js';
import { repositories } from '../repositories/index.js';

export const eventsRouter = Router();

// GET /api/flats/:flatId/events
eventsRouter.get('/flats/:flatId/events', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;

    // Custom events
    const customEvents = await repositories.events.getEventsByFlat(flatId);
    const flatChores = await repositories.chores.getChoresByFlat(flatId);
    const flatBills = await repositories.bills.getBillsByFlat(flatId);
    const flatVisitors = await repositories.visitors.getVisitorsByFlat(flatId);

    // Generate synthetic events from chores, bills, visitors for complete calendar view
    const choreEvents: CalendarEvent[] = flatChores
      .filter((c) => c.status !== 'completed')
      .map((c) => ({
        id: `chore-ev-${c.id}`,
        flatId,
        title: `Chore: ${c.title}`,
        description: c.description,
        eventType: 'chore',
        startAt: c.dueAt,
        endAt: c.dueAt,
        createdBy: c.createdBy,
        linkedRecordType: 'chore',
        linkedRecordId: c.id,
        createdAt: c.createdAt,
      }));

    const billEvents: CalendarEvent[] = flatBills
      .filter((b) => b.status !== 'paid')
      .map((b) => ({
        id: `bill-ev-${b.id}`,
        flatId,
        title: `Bill Due: ${b.title}`,
        description: `Period: ${b.billingPeriod}`,
        eventType: 'bill',
        startAt: new Date(b.dueDate).toISOString(),
        endAt: new Date(b.dueDate).toISOString(),
        createdBy: b.createdBy,
        linkedRecordType: 'bill',
        linkedRecordId: b.id,
        createdAt: b.createdAt,
      }));

    const visitorEvents: CalendarEvent[] = flatVisitors.map((v) => ({
      id: `vis-ev-${v.id}`,
      flatId,
      title: `Guest: ${v.visitorName}`,
      description: v.purpose,
      eventType: 'visitor',
      startAt: v.expectedArrival,
      endAt: v.expectedDeparture,
      createdBy: v.hostId,
      linkedRecordType: 'visitor',
      linkedRecordId: v.id,
      createdAt: v.createdAt,
    }));

    const allEvents = [...customEvents, ...choreEvents, ...billEvents, ...visitorEvents].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    res.json({ events: allEvents });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/events
eventsRouter.post('/flats/:flatId/events', authMiddleware, requireFlatMembership, async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const currentUserId = req.user!.id;
    const body = createCalendarEventSchema.parse(req.body);

    const newEvent = await repositories.events.createEvent(flatId, currentUserId, body);
    res.status(201).json({ event: newEvent });
  } catch (err) {
    next(err);
  }
});

