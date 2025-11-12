import 'server-only';

import { headers } from 'next/headers';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

export const trpcServer = appRouter.createCaller(
  await createTRPCContext({
    req: {
      headers: Object.fromEntries(headers()),
    } as any,
    res: {} as any,
  })
);

