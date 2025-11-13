import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  protectedProcedure,
  supervisorProcedure,
  operatorProcedure,
} from '../trpc';
import { WorkOrderStatus, Priority, StepStatus } from '@prisma/client';

export const workOrderRouter = createTRPCRouter({
  // List all work orders (supervisor sees all, operators see assigned/claimed)
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(WorkOrderStatus).optional(),
          teamId: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role;
      const userOrg = (ctx.session.user as any).orgId;
      const userTeamId = (ctx.session.user as any).teamId;

      const baseWhere: any = {
        orgId: userOrg,
        ...(input?.status && { status: input.status }),
      };

      // Supervisors see all work orders
      if (userRole === 'SUPERVISOR') {
        if (input?.teamId) {
          baseWhere.assignedToTeamId = input.teamId;
        }
      } else {
        // Operators see work assigned to their team, claimed by them, or with steps assigned to them
        baseWhere.OR = [
          { claimedById: userId },
          ...(userTeamId ? [{ assignedToTeamId: userTeamId }] : []),
          { steps: { some: { assignedToUserId: userId } } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.workOrder.findMany({
          where: baseWhere,
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedToTeam: {
              select: {
                id: true,
                name: true,
              },
            },
            claimedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                steps: true,
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          take: input?.limit || 50,
          skip: input?.offset || 0,
        }),
        ctx.db.workOrder.count({ where: baseWhere }),
      ]);

      return { items, total };
    }),

  // Get work order by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role;
      const userOrg = (ctx.session.user as any).orgId;
      const userTeamId = (ctx.session.user as any).teamId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.id,
          orgId: userOrg,
        },
        include: {
          workflow: true,
          assignedToTeam: {
            include: {
              members: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          claimedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          steps: {
            orderBy: { stepIndex: 'asc' },
            include: {
              submissions: {
                select: {
                  id: true,
                  submittedAt: true,
                  submittedBy: true,
                },
              },
            },
          },
          submissions: {
            include: {
              formTemplate: {
                select: {
                  name: true,
                },
              },
              submitter: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      // Check access permissions for operators
      if (userRole === 'OPERATOR') {
        const canAccess =
          workOrder.claimedById === userId ||
          (userTeamId && workOrder.assignedToTeamId === userTeamId);

        if (!canAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this work order',
          });
        }
      }

      return workOrder;
    }),

  // Create work order (supervisor only)
  create: supervisorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        workflowId: z.string(),
        assignedToTeamId: z.string().optional(),
        priority: z.nativeEnum(Priority).default('MEDIUM'),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;
      const userId = ctx.session.user.id;

      return ctx.db.workOrder.create({
        data: {
          title: input.title,
          description: input.description,
          workflowId: input.workflowId,
          assignedToTeamId: input.assignedToTeamId,
          priority: input.priority,
          dueDate: input.dueDate,
          orgId: userOrg,
          createdById: userId,
        },
        include: {
          workflow: true,
          assignedToTeam: true,
        },
      });
    }),

  // Assign work order to team (supervisor only)
  assign: supervisorProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      return ctx.db.workOrder.update({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
        data: {
          assignedToTeamId: input.teamId,
          claimedById: null, // Clear any claim when reassigning
        },
      });
    }),

  // Claim work order (operator)
  claim: operatorProcedure
    .input(z.object({ workOrderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userOrg = (ctx.session.user as any).orgId;
      const userTeamId = (ctx.session.user as any).teamId;

      // Verify work order is assigned to user's team
      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
          assignedToTeamId: userTeamId || undefined,
        },
      });

      if (!workOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Work order not found or not assigned to your team',
        });
      }

      if (workOrder.claimedById && workOrder.claimedById !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Work order already claimed by another user',
        });
      }

      return ctx.db.workOrder.update({
        where: { id: input.workOrderId },
        data: {
          claimedById: userId,
          status: 'IN_PROGRESS',
        },
      });
    }),

  // Unclaim work order
  unclaim: operatorProcedure
    .input(z.object({ workOrderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
          claimedById: userId,
        },
      });

      if (!workOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Work order not found or not claimed by you',
        });
      }

      return ctx.db.workOrder.update({
        where: { id: input.workOrderId },
        data: {
          claimedById: null,
          status: 'PENDING',
        },
      });
    }),

  // Update work order status
  updateStatus: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        status: z.nativeEnum(WorkOrderStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role;
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Operators can only update if they claimed it
      if (userRole === 'OPERATOR' && workOrder.claimedById !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.db.workOrder.update({
        where: { id: input.workOrderId },
        data: {
          status: input.status,
          ...(input.status === 'COMPLETED' && { completedAt: new Date() }),
        },
      });
    }),

  // Get work order progress
  getProgress: protectedProcedure
    .input(z.object({ workOrderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
        include: {
          steps: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              submissions: {
                select: {
                  id: true,
                  data: true,
                },
              },
            },
            orderBy: { stepIndex: 'asc' },
          },
          workflow: true,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Get workflow definition steps
      const workflowSteps = (workOrder.workflow.definition as any)?.steps || [];
      const totalSteps = workflowSteps.length;

      // Count completed steps from database records
      const completedSteps = workOrder.steps.filter(
        (s) => s.status === 'COMPLETED'
      ).length;

      // Check if there's an execution plan (branch steps being executed)
      const executionPlan = ((workOrder.data as any)?.executionPlan || []) as any[];
      let currentStepDef;
      let currentStepRecord;

      if (executionPlan.length > 0) {
        // Currently executing a branch step
        currentStepDef = executionPlan[0];
        // Branch steps don't have step records yet - they're virtual
        currentStepRecord = null;
      } else {
        // Normal workflow step
        currentStepDef = workflowSteps[workOrder.currentStepIndex];
        // Get current step record if it exists
        currentStepRecord = workOrder.steps.find(
          (s) => s.stepIndex === workOrder.currentStepIndex
        );
      }

      // Build stepData map from completed steps with form submissions
      const stepData: Record<string, any> = {};
      console.log('[getProgress] Building stepData from completed steps');
      console.log('[getProgress] Total steps:', workOrder.steps.length);
      console.log('[getProgress] Completed steps:', workOrder.steps.filter(s => s.status === 'COMPLETED').length);

      workOrder.steps
        .filter(s => s.status === 'COMPLETED')
        .forEach(step => {
          const stepDef = workflowSteps[step.stepIndex];
          console.log(`[getProgress] Processing step ${step.stepIndex}:`, {
            stepDefId: stepDef?.id,
            hasSubmissions: !!step.submissions,
            submissionsCount: step.submissions?.length || 0,
            hasData: !!step.data,
          });

          if (stepDef) {
            // For form steps, use submission data
            if (step.submissions && step.submissions.length > 0) {
              const latestSubmission = step.submissions[step.submissions.length - 1];
              console.log(`[getProgress] Using submission data for step ${stepDef.id}:`, latestSubmission.data);
              stepData[stepDef.id] = latestSubmission.data;
            } else if (step.data) {
              // For non-form steps (conditional, etc), use step.data
              console.log(`[getProgress] Using step.data for step ${stepDef.id}:`, step.data);
              stepData[stepDef.id] = step.data;
            } else {
              console.warn(`[getProgress] No data found for step ${stepDef.id}`);
            }
          }
        });

      console.log('[getProgress] Final stepData:', stepData);

      return {
        workOrder: {
          id: workOrder.id,
          title: workOrder.title,
          status: workOrder.status,
          currentStepIndex: workOrder.currentStepIndex,
        },
        progress: {
          totalSteps,
          completedSteps,
          percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        },
        currentStep: currentStepDef, // Return workflow definition step
        currentStepRecord, // Also return database record if exists
        workflow: workOrder.workflow,
        stepData, // ✅ Now includes stepData for condition evaluation
      };
    }),

  // Update work order details (Supervisor only)
  update: supervisorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.nativeEnum(Priority).optional(),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;
      const { id, ...data } = input;

      // Verify ownership
      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      return ctx.db.workOrder.update({
        where: { id },
        data,
      });
    }),

  // ========== STEP MANAGEMENT ==========

  // Get all steps for a work order with assignments and submissions
  getSteps: protectedProcedure
    .input(z.object({ workOrderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
        include: {
          workflow: true,
          steps: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              completedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              submissions: {
                include: {
                  formTemplate: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  submitter: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  submittedAt: 'desc',
                },
              },
            },
            orderBy: {
              stepIndex: 'asc',
            },
          },
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      return {
        workOrder,
        steps: workOrder.steps,
      };
    }),

  // Assign a step to a specific user
  assignStep: supervisorProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        stepIndex: z.number(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      // Verify work order exists and belongs to org
      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      // Verify user exists and belongs to org
      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
          orgId: userOrg,
        },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Find or create the step
      const existingStep = await ctx.db.workOrderStep.findUnique({
        where: {
          workOrderId_stepIndex: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
          },
        },
      });

      if (existingStep) {
        return ctx.db.workOrderStep.update({
          where: { id: existingStep.id },
          data: {
            assignedToUserId: input.userId,
          },
        });
      } else {
        // Create new step record
        const workflow = await ctx.db.workflow.findUnique({
          where: { id: workOrder.workflowId },
        });

        const stepDef = (workflow?.definition as any)?.steps?.[input.stepIndex];
        
        return ctx.db.workOrderStep.create({
          data: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
            stepDefinitionId: stepDef?.id || `step-${input.stepIndex}`,
            assignedToUserId: input.userId,
            status: 'PENDING',
          },
        });
      }
    }),

  // Unassign a step
  unassignStep: supervisorProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        stepIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      const step = await ctx.db.workOrderStep.findUnique({
        where: {
          workOrderId_stepIndex: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
          },
        },
      });

      if (!step) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Step not found' });
      }

      return ctx.db.workOrderStep.update({
        where: { id: step.id },
        data: {
          assignedToUserId: null,
        },
      });
    }),

  // Update step status
  updateStepStatus: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        stepIndex: z.number(),
        status: z.nativeEnum(StepStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userOrg = (ctx.session.user as any).orgId;
      const userRole = (ctx.session.user as any).role;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      const step = await ctx.db.workOrderStep.findUnique({
        where: {
          workOrderId_stepIndex: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
          },
        },
      });

      if (!step) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Step not found' });
      }

      // Check permissions: assigned user or supervisor
      if (step.assignedToUserId && step.assignedToUserId !== userId && userRole !== 'SUPERVISOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This step is assigned to another user',
        });
      }

      const updateData: any = {
        status: input.status,
      };

      if (input.status === 'IN_PROGRESS' && !step.startedAt) {
        updateData.startedAt = new Date();
      }

      if (input.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedById = userId;
      }

      return ctx.db.workOrderStep.update({
        where: { id: step.id },
        data: updateData,
      });
    }),

  // Complete a step (with form submission or conditional metadata)
  completeStep: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        stepIndex: z.number(),
        submissionId: z.string().optional(), // Optional for conditional steps
        metadata: z.record(z.any()).optional(), // For conditional branch decisions
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userOrg = (ctx.session.user as any).orgId;
      const userRole = (ctx.session.user as any).role;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      // Find or create step
      let step = await ctx.db.workOrderStep.findUnique({
        where: {
          workOrderId_stepIndex: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
          },
        },
      });

      if (!step) {
        // Create step if it doesn't exist
        const workflow = await ctx.db.workflow.findUnique({
          where: { id: workOrder.workflowId },
        });
        const stepDef = (workflow?.definition as any)?.steps?.[input.stepIndex];

        step = await ctx.db.workOrderStep.create({
          data: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
            stepDefinitionId: stepDef?.id || `step-${input.stepIndex}`,
            status: 'PENDING',
          },
        });
      }

      // Check permissions
      if (step.assignedToUserId && step.assignedToUserId !== userId && userRole !== 'SUPERVISOR') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This step is assigned to another user',
        });
      }

      // Only verify submission for form steps
      if (input.submissionId) {
        const submission = await ctx.db.formSubmission.findFirst({
          where: {
            id: input.submissionId,
            workOrderId: input.workOrderId,
          },
        });

        if (!submission) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Submission not found' });
        }

        // Link the submission to this step if not already linked
        if (!submission.workOrderStepId) {
          await ctx.db.formSubmission.update({
            where: { id: input.submissionId },
            data: { workOrderStepId: step.id },
          });
        }
      }

      // Update step to completed (with metadata if provided)
      const updatedStep = await ctx.db.workOrderStep.update({
        where: { id: step.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: userId,
          data: input.metadata || null, // Store metadata for conditional steps
        },
      });

      // Get workflow definition
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: workOrder.workflowId },
      });
      const workflowSteps = (workflow?.definition as any)?.steps || [];
      const totalSteps = workflowSteps.length;

      // Check if current step is conditional and has metadata
      const currentStepDef = workflowSteps[input.stepIndex];
      let nextStepIndex = input.stepIndex + 1;

      if (currentStepDef?.type === 'conditional' && input.metadata) {
        // Conditional step completed - need to execute branch steps
        const branchIndex = input.metadata.branchIndex;
        const branchTaken = input.metadata.branchTaken;

        // Get the selected branch steps
        let branchSteps: any[] = [];
        if (branchTaken === 'default' && currentStepDef.config.defaultBranch) {
          branchSteps = currentStepDef.config.defaultBranch;
        } else if (typeof branchIndex === 'number' && currentStepDef.config.branches[branchIndex]) {
          branchSteps = currentStepDef.config.branches[branchIndex].nextSteps || [];
        }

        // Store branch execution plan in work order data
        // This is a simple queue of steps to execute before moving to next top-level step
        const currentExecutionPlan = (workOrder.data as any)?.executionPlan || [];
        const newExecutionPlan = [
          ...branchSteps.map((s: any, idx: number) => ({
            ...s,
            _branchStepIndex: idx,
            _parentStepIndex: input.stepIndex,
          })),
          ...currentExecutionPlan,
        ];

        await ctx.db.workOrder.update({
          where: { id: input.workOrderId },
          data: {
            data: {
              ...((workOrder.data as any) || {}),
              executionPlan: newExecutionPlan,
            },
            status: 'IN_PROGRESS',
          },
        });

        return updatedStep;
      }

      // Check if there's an execution plan (branch steps to execute)
      const executionPlan = (workOrder.data as any)?.executionPlan || [];

      if (executionPlan.length > 0) {
        // Still have branch steps to execute, remove completed one
        const remainingPlan = executionPlan.slice(1);
        await ctx.db.workOrder.update({
          where: { id: input.workOrderId },
          data: {
            data: {
              ...((workOrder.data as any) || {}),
              executionPlan: remainingPlan,
            },
            status: 'IN_PROGRESS',
          },
        });

        return updatedStep;
      }

      // No more branch steps, check if workflow is complete
      const completedSteps = await ctx.db.workOrderStep.count({
        where: {
          workOrderId: input.workOrderId,
          status: 'COMPLETED',
        },
      });

      // If all top-level steps completed, mark work order as completed
      if (nextStepIndex >= totalSteps) {
        await ctx.db.workOrder.update({
          where: { id: input.workOrderId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            currentStepIndex: totalSteps,
          },
        });
      } else {
        // Move to next step
        await ctx.db.workOrder.update({
          where: { id: input.workOrderId },
          data: {
            currentStepIndex: nextStepIndex,
            status: 'IN_PROGRESS',
          },
        });
      }

      return updatedStep;
    }),

  // Get detailed step info with submissions
  getStepDetail: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        stepIndex: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userOrg = (ctx.session.user as any).orgId;

      const workOrder = await ctx.db.workOrder.findFirst({
        where: {
          id: input.workOrderId,
          orgId: userOrg,
        },
        include: {
          workflow: true,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Work order not found' });
      }

      const step = await ctx.db.workOrderStep.findUnique({
        where: {
          workOrderId_stepIndex: {
            workOrderId: input.workOrderId,
            stepIndex: input.stepIndex,
          },
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          submissions: {
            include: {
              formTemplate: true,
              submitter: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Get step definition from workflow
      const stepDef = (workOrder.workflow.definition as any)?.steps?.[input.stepIndex];

      return {
        step,
        stepDefinition: stepDef,
        workOrder,
      };
    }),
});

