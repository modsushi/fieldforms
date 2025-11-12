import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const formsRouter = createTRPCRouter({
  // Get all form templates for the user's organization
  getTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        isActive: true,
      };

      // Include org templates or public templates
      where.OR = [
        { orgId: ctx.session.user.orgId },
        { isPublic: true },
      ];

      if (input.category) {
        where.category = input.category;
      }

      const [items, total] = await Promise.all([
        ctx.db.formTemplate.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit || 50,
          skip: input.offset || 0,
        }),
        ctx.db.formTemplate.count({ where }),
      ]);

      return { items, total };
    }),

  // Get a single form template
  getTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.formTemplate.findFirst({
        where: {
          id: input.id,
          OR: [
            { orgId: ctx.session.user.orgId },
            { isPublic: true },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      return template;
    }),

  // Create a new form template
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        schema: z.any(), // Form sections and fields
        variables: z.record(z.any()).optional(),
        computedFields: z.record(z.any()).optional(),
        validations: z.record(z.any()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.formTemplate.create({
        data: {
          orgId: ctx.session.user.orgId,
          name: input.name,
          description: input.description,
          category: input.category,
          schema: input.schema,
          variables: input.variables || {},
          computedFields: input.computedFields || {},
          validations: input.validations || {},
          isPublic: input.isPublic || false,
          createdBy: ctx.session.user.id,
        },
      });
    }),

  // Update a form template
  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        schema: z.any().optional(),
        variables: z.record(z.any()).optional(),
        computedFields: z.record(z.any()).optional(),
        validations: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const template = await ctx.db.formTemplate.findFirst({
        where: {
          id,
          orgId: ctx.session.user.orgId,
        },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      return ctx.db.formTemplate.update({
        where: { id },
        data,
      });
    }),

  // Submit a form
  submitForm: protectedProcedure
    .input(
      z.object({
        formTemplateId: z.string(),
        entityId: z.string().optional(),
        workflowStepId: z.string().optional(),
        workOrderId: z.string().optional(),
        workOrderStepId: z.string().optional(),
        collectionId: z.string().optional(),
        data: z.record(z.any()),
        location: z.string().optional(),
        deviceInfo: z.record(z.any()).optional(),
        offlineUuid: z.string().optional(),
        entitiesToCreate: z.array(z.object({
          fieldId: z.string(),
          entityType: z.string(),
          name: z.string(),
          geometry: z.string().optional(),
          metadata: z.record(z.any()).optional(),
          tags: z.array(z.string()).optional(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        // Step 1: Create form submission first (so we have an ID to link entities to)
        const submission = await tx.formSubmission.create({
          data: {
            formTemplateId: input.formTemplateId,
            entityId: input.entityId,
            workflowStepId: input.workflowStepId,
            workOrderId: input.workOrderId,
            workOrderStepId: input.workOrderStepId,
            collectionId: input.collectionId,
            data: input.data,
            location: input.location,
            deviceInfo: input.deviceInfo || {},
            offlineUuid: input.offlineUuid,
            submittedBy: ctx.session.user.id,
          },
        });

        // Step 2: Create entities and link them to the submission
        const createdEntities: Record<string, string> = {};
        
        if (input.entitiesToCreate && input.entitiesToCreate.length > 0) {
          for (const entityData of input.entitiesToCreate) {
            const entity = await tx.entity.create({
              data: {
                orgId: ctx.session.user.orgId,
                entityType: entityData.entityType,
                name: entityData.name,
                geometry: entityData.geometry,
                metadata: {
                  ...entityData.metadata,
                  createdFromForm: true,
                  createdByUser: ctx.session.user.id,
                  createdByUserName: ctx.session.user.name,
                  createdFromSubmission: submission.id,
                },
                tags: entityData.tags || ['field-created'],
                createdBySubmissionId: submission.id,
              },
            });
            createdEntities[entityData.fieldId] = entity.id;
          }

          // Step 3: Update submission data with created entity IDs
          if (Object.keys(createdEntities).length > 0) {
            const updatedData = { ...input.data };
            Object.entries(createdEntities).forEach(([fieldId, entityId]) => {
              updatedData[fieldId] = entityId;
            });

            await tx.formSubmission.update({
              where: { id: submission.id },
              data: { data: updatedData },
            });
          }
        }

        return submission;
      });
    }),

  // Get submissions for a form template
  getSubmissions: protectedProcedure
    .input(
      z.object({
        formTemplateId: z.string().optional(),
        entityId: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        // CRITICAL: Only show submissions from user's organization
        submitter: {
          orgId: ctx.session.user.orgId,
        },
      };

      if (input.formTemplateId) {
        where.formTemplateId = input.formTemplateId;
      }

      if (input.entityId) {
        where.entityId = input.entityId;
      }

      const [items, total] = await Promise.all([
        ctx.db.formSubmission.findMany({
          where,
          include: {
            formTemplate: {
              select: {
                id: true,
                name: true,
              },
            },
            entity: {
              select: {
                id: true,
                name: true,
                entityType: true,
              },
            },
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
                orgId: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: input.limit || 50,
          skip: input.offset || 0,
        }),
        ctx.db.formSubmission.count({ where }),
      ]);

      return { items, total };
    }),

  // Get a single submission by ID
  getSubmission: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const submission = await ctx.db.formSubmission.findFirst({
        where: { 
          id: input.id,
          // CRITICAL: Verify submission belongs to user's organization
          submitter: {
            orgId: ctx.session.user.orgId,
          },
        },
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              description: true,
              schema: true,
            },
          },
          entity: {
            select: {
              id: true,
              name: true,
              entityType: true,
              metadata: true,
            },
          },
          submitter: {
            select: {
              id: true,
              name: true,
              email: true,
              orgId: true,
            },
          },
          workOrder: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          workOrderStep: {
            select: {
              id: true,
              stepIndex: true,
            },
          },
        },
      });

      if (!submission) {
        throw new Error('Submission not found or access denied');
      }

      return submission;
    }),
});

