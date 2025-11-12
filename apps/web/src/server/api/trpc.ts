import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@fieldform/database';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // For App Router, getServerSession doesn't need req/res
  const session = await getServerSession(authOptions);

  return {
    session,
    db,
    headers: opts.req.headers,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Organization admin only procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({
    ctx,
  });
});

/**
 * Supervisor only procedure
 */
export const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = (ctx.session.user as any).role;
  if (userRole !== 'SUPERVISOR') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'This action requires supervisor privileges' 
    });
  }
  return next({
    ctx,
  });
});

/**
 * Operator procedure (can access assigned work)
 */
export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Operators are authenticated users with OPERATOR role
  // Access control is handled at the query level
  return next({
    ctx,
  });
});

