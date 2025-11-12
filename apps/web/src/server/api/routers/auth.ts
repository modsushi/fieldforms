import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import bcrypt from 'bcryptjs';

export const authRouter = createTRPCRouter({
  // Register a new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name: z.string().min(1, 'Name is required'),
        role: z.enum(['SUPERVISOR', 'OPERATOR']).default('OPERATOR'),
        organizationName: z.string().min(1, 'Organization name is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create organization and user in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create organization
        const org = await tx.organization.create({
          data: {
            name: input.organizationName,
          },
        });

        // Create user
        const user = await tx.user.create({
          data: {
            email: input.email,
            password: hashedPassword,
            name: input.name,
            role: input.role,
            orgId: org.id,
          },
        });

        return { user, organization: org };
      });

      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      };
    }),

  // Check if email exists
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      return { exists: !!user };
    }),
});
