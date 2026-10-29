import { Router } from 'express';
import { createFlatSchema, createInviteSchema } from '@flatflow/shared';
import { authMiddleware } from '../middleware/auth.js';
import { repositories } from '../repositories/index.js';

export const flatsRouter = Router();

// Protect all flat routes
flatsRouter.use(authMiddleware);

// GET /api/flats - List user's flats
flatsRouter.get('/flats', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userFlats = await repositories.flats.getUserFlats(userId);
    res.json({ flats: userFlats });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats - Create a new flat
flatsRouter.post('/flats', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = createFlatSchema.parse(req.body);

    const newFlat = await repositories.flats.createFlat({
      name: body.name,
      addressLabel: body.addressLabel ?? null,
      currency: body.currency ?? 'INR',
      createdBy: userId,
    });

    const invite = await repositories.flats.createInvite(newFlat.id, userId);

    res.status(201).json({
      flat: newFlat,
      inviteCode: invite.code,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/flats/:flatId - Get details of specific flat & members
flatsRouter.get('/flats/:flatId', async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const flat = await repositories.flats.getFlatById(flatId);

    if (!flat) {
      res.status(404).json({ error: 'Not Found', message: 'Flat not found' });
      return;
    }

    const members = await repositories.flats.getFlatMembers(flatId);

    res.json({
      flat,
      members,
      inviteCode: null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/invites - Create invite code
flatsRouter.post('/flats/:flatId/invites', async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.user!.id;
    createInviteSchema.parse(req.body);

    const invite = await repositories.flats.createInvite(flatId, userId);
    res.status(201).json({ invite });
  } catch (err) {
    next(err);
  }
});

// POST /api/invites/:code/accept - Accept invitation
flatsRouter.post('/invites/:code/accept', async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = req.user!.id;

    const invite = await repositories.flats.getInviteByCode(code);

    if (!invite) {
      res.status(404).json({ error: 'Not Found', message: 'Invalid invitation code' });
      return;
    }

    if (new Date(invite.expiresAt) < new Date()) {
      res.status(400).json({ error: 'Expired', message: 'This invitation code has expired' });
      return;
    }

    if (invite.useCount >= invite.maxUses) {
      res.status(400).json({ error: 'Limit reached', message: 'Invite maximum use limit reached' });
      return;
    }

    const flat = await repositories.flats.getFlatById(invite.flatId);
    if (!flat) {
      res.status(404).json({ error: 'Not Found', message: 'Associated flat not found' });
      return;
    }

    // Check if already a member
    const existingMember = await repositories.flats.getFlatMember(flat.id, userId);
    if (existingMember) {
      res.json({
        message: 'Already a member of this flat',
        flat,
        membership: existingMember,
      });
      return;
    }

    const newMember = await repositories.flats.addMember({
      flatId: flat.id,
      userId,
      role: 'member',
      status: 'active',
    });

    await repositories.flats.useInvite(invite.id);

    res.status(200).json({
      message: `Successfully joined ${flat.name}!`,
      flat,
      membership: newMember,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/flats/:flatId - Delete or remove household
flatsRouter.delete('/flats/:flatId', async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.user!.id;

    const member = await repositories.flats.getFlatMember(flatId, userId);
    if (member) {
      await repositories.flats.removeMember(flatId, member.id);
    }

    res.json({ success: true, message: 'Household removed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats/:flatId/leave - Leave household
flatsRouter.post('/flats/:flatId/leave', async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const userId = req.user!.id;

    const member = await repositories.flats.getFlatMember(flatId, userId);
    if (member) {
      await repositories.flats.removeMember(flatId, member.id);
    }

    res.json({ success: true, message: 'Left household successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/flats-requests - List pending flat creation requests
flatsRouter.get('/flats-requests', async (_req, res, next) => {
  try {
    const requests = await repositories.flats.getPendingFlatRequests();
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats-requests - Submit request to add flat
flatsRouter.post('/flats-requests', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const profile = await repositories.profiles.getProfileById(userId);
    const { name, addressLabel, currency } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Bad Request', message: 'Flat name is required' });
      return;
    }

    const newRequest = await repositories.flats.createFlatRequest({
      name,
      addressLabel: addressLabel || undefined,
      currency: currency || 'INR',
      requestedBy: userId,
      requesterName: profile?.fullName || req.user!.fullName || 'Roommate',
    });

    res.status(201).json({ request: newRequest });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats-requests/:requestId/approve - Admin approves flat request
flatsRouter.post('/flats-requests/:requestId/approve', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user!.id;

    const result = await repositories.flats.approveFlatRequest(requestId, adminId);
    res.json({
      success: true,
      message: `Flat "${result.flat.name}" approved and activated!`,
      flat: result.flat,
      request: result.request,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/flats-requests/:requestId/reject - Admin rejects flat request
flatsRouter.post('/flats-requests/:requestId/reject', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user!.id;

    const request = await repositories.flats.rejectFlatRequest(requestId, adminId);
    res.json({ success: true, message: 'Flat request rejected', request });
  } catch (err) {
    next(err);
  }
});
