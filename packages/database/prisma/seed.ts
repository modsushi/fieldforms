import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Organization',
      subscriptionTier: 'free',
      settings: {},
    },
  });
  console.log('✅ Created organization:', org.name);

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@demo.com' },
    update: {},
    create: {
      email: 'supervisor@demo.com',
      password: hashedPassword,
      name: 'Demo Supervisor',
      role: 'SUPERVISOR',
      orgId: org.id,
    },
  });
  console.log('✅ Created supervisor:', supervisor.email);

  const operator = await prisma.user.upsert({
    where: { email: 'operator@demo.com' },
    update: {},
    create: {
      email: 'operator@demo.com',
      password: hashedPassword,
      name: 'Demo Operator',
      role: 'OPERATOR',
      orgId: org.id,
    },
  });
  console.log('✅ Created operator:', operator.email);

  // Create Form Templates
  const inspectionForm = await prisma.formTemplate.create({
    data: {
      name: 'Site Inspection Form',
      description: 'Standard site inspection checklist',
      category: 'inspection',
      orgId: org.id,
      createdBy: supervisor.id,
      isActive: true,
      schema: {
        sections: [
        {
          id: 'section-1',
          title: 'Site Information',
          fields: [
            {
              id: 'site-name',
              type: 'text',
              label: 'Site Name',
              required: true,
              placeholder: 'Enter site name',
            },
            {
              id: 'location',
              type: 'location',
              label: 'GPS Location',
              required: true,
            },
            {
              id: 'inspector-name',
              type: 'text',
              label: 'Inspector Name',
              required: true,
            },
          ],
        },
        {
          id: 'section-2',
          title: 'Safety Checklist',
          fields: [
            {
              id: 'safety-equipment',
              type: 'checkbox',
              label: 'Safety equipment present?',
              required: true,
            },
            {
              id: 'hazards',
              type: 'select',
              label: 'Any hazards identified?',
              required: true,
              options: {
                source: 'static',
                value: [
                  { label: 'None', value: 'none' },
                  { label: 'Minor', value: 'minor' },
                  { label: 'Major', value: 'major' },
                  { label: 'Critical', value: 'critical' },
                ],
              },
            },
            {
              id: 'notes',
              type: 'textarea',
              label: 'Additional Notes',
              placeholder: 'Enter any additional observations',
            },
          ],
        },
        {
          id: 'section-3',
          title: 'Documentation',
          fields: [
            {
              id: 'photos',
              type: 'photo',
              label: 'Site Photos',
              required: false,
            },
          ],
        },
      ],
      },
    },
  });
  console.log('✅ Created form template:', inspectionForm.name);

  const equipmentForm = await prisma.formTemplate.create({
    data: {
      name: 'Equipment Maintenance Log',
      description: 'Log equipment maintenance activities',
      category: 'maintenance',
      orgId: org.id,
      createdBy: supervisor.id,
      isActive: true,
      schema: {
        sections: [
        {
          id: 'section-1',
          title: 'Equipment Details',
          fields: [
            {
              id: 'equipment-selector',
              type: 'entity_selector',
              label: 'Select Equipment',
              required: true,
              options: {
                source: 'entity',
                value: {
                  entityType: 'equipment',
                  tags: [],
                },
              },
            },
            {
              id: 'maintenance-type',
              type: 'select',
              label: 'Maintenance Type',
              required: true,
              options: {
                source: 'static',
                value: [
                  { label: 'Routine Inspection', value: 'routine' },
                  { label: 'Repair', value: 'repair' },
                  { label: 'Replacement', value: 'replacement' },
                  { label: 'Emergency', value: 'emergency' },
                ],
              },
            },
            {
              id: 'condition',
              type: 'radio',
              label: 'Equipment Condition',
              required: true,
              options: {
                source: 'static',
                value: [
                  { label: 'Excellent', value: 'excellent' },
                  { label: 'Good', value: 'good' },
                  { label: 'Fair', value: 'fair' },
                  { label: 'Poor', value: 'poor' },
                ],
              },
            },
          ],
        },
        {
          id: 'section-2',
          title: 'Work Performed',
          fields: [
            {
              id: 'work-description',
              type: 'textarea',
              label: 'Work Description',
              required: true,
              placeholder: 'Describe the maintenance work performed',
            },
            {
              id: 'parts-replaced',
              type: 'text',
              label: 'Parts Replaced',
              placeholder: 'List any parts that were replaced',
            },
            {
              id: 'hours-spent',
              type: 'number',
              label: 'Hours Spent',
              required: true,
            },
          ],
        },
      ],
      },
    },
  });
  console.log('✅ Created form template:', equipmentForm.name);

  const fieldEntityForm = await prisma.formTemplate.create({
    data: {
      name: 'Field Asset Discovery',
      description: 'Create new assets discovered in the field',
      category: 'discovery',
      orgId: org.id,
      createdBy: supervisor.id,
      isActive: true,
      schema: {
        sections: [
        {
          id: 'section-1',
          title: 'Asset Information',
          fields: [
            {
              id: 'new-asset',
              type: 'entity_creator',
              label: 'Create New Asset',
              required: true,
              options: {
                source: 'entity',
                value: {
                  entityType: 'asset',
                  mode: 'minimal',
                  minimalConfig: {
                    nameField: null,
                    captureLocation: true,
                  },
                  autoTags: ['field-created', 'needs-review'],
                },
              },
            },
            {
              id: 'asset-description',
              type: 'textarea',
              label: 'Asset Description',
              required: true,
              placeholder: 'Describe the asset in detail',
            },
            {
              id: 'asset-condition',
              type: 'radio',
              label: 'Condition',
              required: true,
              options: {
                source: 'static',
                value: [
                  { label: 'New', value: 'new' },
                  { label: 'Good', value: 'good' },
                  { label: 'Fair', value: 'fair' },
                  { label: 'Poor', value: 'poor' },
                ],
              },
            },
            {
              id: 'asset-photos',
              type: 'photo',
              label: 'Asset Photos',
              required: true,
            },
          ],
        },
      ],
      },
    },
  });
  console.log('✅ Created form template:', fieldEntityForm.name);

  // Create Sample Entities
  const site1 = await prisma.entity.create({
    data: {
      orgId: org.id,
      entityType: 'site',
      name: 'Downtown Office',
      code: 'SITE-001',
      geometry: 'POINT(-122.4194 37.7749)',
      tags: ['headquarters'],
      metadata: {
        address: '123 Main St, San Francisco, CA',
        capacity: '200 people',
      },
    },
  });

  const site2 = await prisma.entity.create({
    data: {
      orgId: org.id,
      entityType: 'site',
      name: 'North Warehouse',
      code: 'SITE-002',
      geometry: 'POINT(-122.4000 37.7900)',
      tags: ['warehouse', 'storage'],
      metadata: {
        address: '456 Industrial Blvd, San Francisco, CA',
        capacity: '50000 sq ft',
      },
    },
  });

  const equipment1 = await prisma.entity.create({
    data: {
      orgId: org.id,
      entityType: 'equipment',
      name: 'Forklift #1',
      code: 'EQ-FL-001',
      parentId: site2.id,
      tags: ['heavy-machinery'],
      metadata: {
        manufacturer: 'Toyota',
        model: 'Model 8000',
        serialNumber: 'TY8000-12345',
      },
    },
  });

  console.log('✅ Created sample entities');

  // Create Workflows
  const inspectionWorkflow = await prisma.workflow.create({
    data: {
      orgId: org.id,
      name: 'Daily Site Inspection',
      description: 'Standard daily inspection workflow',
      createdBy: supervisor.id,
      isActive: true,
      definition: {
        steps: [
          {
            id: 'step-1',
            type: 'form',
            name: 'Inspection Form',
            description: 'Complete the site inspection form',
            config: {
              formTemplateId: inspectionForm.id,
            },
          },
        ],
      },
      steps: [
        {
          id: 'step-1',
          type: 'form',
          name: 'Inspection Form',
          description: 'Complete the site inspection form',
          config: {
            formTemplateId: inspectionForm.id,
          },
        },
      ],
      triggerConfig: {},
    },
  });
  console.log('✅ Created workflow:', inspectionWorkflow.name);

  const maintenanceWorkflow = await prisma.workflow.create({
    data: {
      orgId: org.id,
      name: 'Equipment Maintenance Routine',
      description: 'Regular equipment maintenance process',
      createdBy: supervisor.id,
      isActive: true,
      definition: {
        steps: [
          {
            id: 'step-1',
            type: 'form',
            name: 'Equipment Check',
            description: 'Log maintenance activities',
            config: {
              formTemplateId: equipmentForm.id,
            },
          },
        ],
      },
      steps: [
        {
          id: 'step-1',
          type: 'form',
          name: 'Equipment Check',
          description: 'Log maintenance activities',
          config: {
            formTemplateId: equipmentForm.id,
          },
        },
      ],
      triggerConfig: {},
    },
  });
  console.log('✅ Created workflow:', maintenanceWorkflow.name);

  const discoveryWorkflow = await prisma.workflow.create({
    data: {
      orgId: org.id,
      name: 'Field Asset Discovery',
      description: 'Workflow for discovering and registering new assets in the field',
      createdBy: supervisor.id,
      isActive: true,
      definition: {
        steps: [
          {
            id: 'step-1',
            type: 'form',
            name: 'Asset Discovery Form',
            description: 'Create a new asset from the field',
            config: {
              formTemplateId: fieldEntityForm.id,
            },
          },
        ],
      },
      steps: [
        {
          id: 'step-1',
          type: 'form',
          name: 'Asset Discovery Form',
          description: 'Create a new asset from the field',
          config: {
            formTemplateId: fieldEntityForm.id,
          },
        },
      ],
      triggerConfig: {},
    },
  });
  console.log('✅ Created workflow:', discoveryWorkflow.name);

  console.log('\n✨ Seeding complete!\n');
  console.log('📧 Credentials:');
  console.log('   Supervisor: supervisor@demo.com / password123');
  console.log('   Operator: operator@demo.com / password123');
  console.log('\n📋 Created:');
  console.log(`   - ${3} Form Templates`);
  console.log(`   - ${3} Entities (2 sites, 1 equipment)`);
  console.log(`   - ${3} Workflows`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
