import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { entitiesRouter } from './routers/entities';
import { formsRouter } from './routers/forms';
import { teamRouter } from './routers/teams';
import { workOrderRouter } from './routers/work-orders';
import { workflowsRouter } from './routers/workflows';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  entities: entitiesRouter,
  forms: formsRouter,
  teams: teamRouter,
  workOrders: workOrderRouter,
  workflows: workflowsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

