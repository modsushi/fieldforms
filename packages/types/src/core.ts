import { z } from 'zod';

// Organization
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subscriptionTier: z.enum(['free', 'pro', 'business', 'enterprise']).default('free'),
  settings: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof organizationSchema>;

// User
export const userSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Device Info
export const deviceInfoSchema = z.object({
  deviceId: z.string(),
  platform: z.string(),
  osVersion: z.string(),
  appVersion: z.string(),
  userAgent: z.string().optional(),
});

export type DeviceInfo = z.infer<typeof deviceInfoSchema>;

