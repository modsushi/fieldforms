import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null, role: UserRole): boolean {
  if (!session?.user) return false;
  return (session.user as any).role === role;
}

/**
 * Check if user is a supervisor
 */
export function isSupervisor(session: Session | null): boolean {
  return hasRole(session, 'SUPERVISOR');
}

/**
 * Check if user is an operator
 */
export function isOperator(session: Session | null): boolean {
  return hasRole(session, 'OPERATOR');
}

/**
 * Check if user can access a work order
 */
export async function canAccessWorkOrder(
  userId: string,
  userRole: UserRole,
  workOrderId: string,
  db: any
): Promise<boolean> {
  // Supervisors can access all work orders in their org
  if (userRole === 'SUPERVISOR') {
    return true;
  }

  // Operators can only access work orders assigned to their team or claimed by them
  const workOrder = await db.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      assignedToTeam: {
        include: {
          members: { select: { id: true } },
        },
      },
    },
  });

  if (!workOrder) return false;

  // Check if claimed by this user
  if (workOrder.claimedById === userId) return true;

  // Check if user is in assigned team
  if (workOrder.assignedToTeam) {
    return workOrder.assignedToTeam.members.some((m) => m.id === userId);
  }

  return false;
}

/**
 * Get accessible work order IDs for a user
 */
export async function getAccessibleWorkOrderIds(
  userId: string,
  userRole: UserRole,
  orgId: string,
  db: any
): Promise<string[]> {
  // Supervisors see all work orders in org
  if (userRole === 'SUPERVISOR') {
    const workOrders = await db.workOrder.findMany({
      where: { orgId },
      select: { id: true },
    });
    return workOrders.map((wo: any) => wo.id);
  }

  // Operators see work orders assigned to their team or claimed by them
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  const workOrders = await db.workOrder.findMany({
    where: {
      orgId,
      OR: [
        { claimedById: userId },
        ...(user?.teamId ? [{ assignedToTeamId: user.teamId }] : []),
      ],
    },
    select: { id: true },
  });

  return workOrders.map((wo: any) => wo.id);
}

