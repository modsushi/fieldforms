import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test form templates...');

  // Get the first organization and user
  const org = await prisma.organization.findFirst();
  const user = await prisma.user.findFirst();

  if (!org || !user) {
    console.error('❌ No organization or user found. Please create one first.');
    return;
  }

  console.log(`Using org: ${org.name} (${org.id})`);
  console.log(`Using user: ${user.name} (${user.id})`);

  // Template 1: Equipment Inspection Form (Pass/Fail)
  const inspectionForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-inspection-form-001' },
    update: {},
    create: {
      id: 'seed-inspection-form-001',
      orgId: org.id,
      createdById: user.id,
      name: '📋 Equipment Inspection',
      description: 'Standard equipment inspection checklist with pass/fail status',
      category: 'inspection',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Equipment Information',
            fields: [
              {
                id: 'equipment_name',
                label: 'Equipment Name',
                type: 'text',
                required: true,
                placeholder: 'Enter equipment name',
              },
              {
                id: 'equipment_id',
                label: 'Equipment ID',
                type: 'text',
                required: true,
                placeholder: 'e.g., EQ-2024-001',
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Inspection Results',
            fields: [
              {
                id: 'inspection_status',
                label: 'Inspection Status',
                type: 'select',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Pass', value: 'pass' },
                    { label: 'Fail', value: 'fail' },
                    { label: 'Needs Review', value: 'review' },
                  ],
                },
              },
              {
                id: 'inspection_notes',
                label: 'Inspection Notes',
                type: 'textarea',
                required: false,
                placeholder: 'Add any observations or notes',
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Equipment Inspection Form');

  // Template 2: Safety Check (Checkboxes)
  const safetyForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-safety-check-002' },
    update: {},
    create: {
      id: 'seed-safety-check-002',
      orgId: org.id,
      createdById: user.id,
      name: '🦺 Safety Checklist',
      description: 'Pre-work safety checklist with boolean checks',
      category: 'safety',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Safety Equipment',
            fields: [
              {
                id: 'ppe_required',
                label: 'PPE Required for this Task?',
                type: 'checkbox',
                required: false,
                helpText: 'Check if personal protective equipment is needed',
              },
              {
                id: 'helmet',
                label: 'Hard Hat Available',
                type: 'checkbox',
                required: false,
              },
              {
                id: 'gloves',
                label: 'Safety Gloves Available',
                type: 'checkbox',
                required: false,
              },
              {
                id: 'safety_glasses',
                label: 'Safety Glasses Available',
                type: 'checkbox',
                required: false,
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Hazard Assessment',
            fields: [
              {
                id: 'hazards_present',
                label: 'Hazards Present?',
                type: 'checkbox',
                required: false,
              },
              {
                id: 'hazard_type',
                label: 'Type of Hazard',
                type: 'select',
                required: false,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Electrical', value: 'electrical' },
                    { label: 'Chemical', value: 'chemical' },
                    { label: 'Physical', value: 'physical' },
                    { label: 'Biological', value: 'biological' },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Safety Checklist Form');

  // Template 3: Issue Severity (Number-based)
  const issueForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-issue-report-003' },
    update: {},
    create: {
      id: 'seed-issue-report-003',
      orgId: org.id,
      createdById: user.id,
      name: '⚠️ Issue Report',
      description: 'Report issues with severity ratings',
      category: 'maintenance',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Issue Details',
            fields: [
              {
                id: 'issue_title',
                label: 'Issue Title',
                type: 'text',
                required: true,
                placeholder: 'Brief description of the issue',
              },
              {
                id: 'severity_level',
                label: 'Severity Level (1-10)',
                type: 'number',
                required: true,
                placeholder: '1 = Minor, 10 = Critical',
                validation: {
                  min: 1,
                  max: 10,
                },
              },
              {
                id: 'priority',
                label: 'Priority',
                type: 'select',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Critical', value: 'critical' },
                  ],
                },
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Additional Information',
            fields: [
              {
                id: 'description',
                label: 'Detailed Description',
                type: 'textarea',
                required: true,
                placeholder: 'Provide a detailed description of the issue',
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Issue Report Form');

  // Template 4: Failure Investigation (for conditional branch follow-ups)
  const investigationForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-failure-investigation-004' },
    update: {},
    create: {
      id: 'seed-failure-investigation-004',
      orgId: org.id,
      createdById: user.id,
      name: '🔍 Failure Investigation',
      description: 'Detailed investigation for failed inspections',
      category: 'investigation',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Failure Analysis',
            fields: [
              {
                id: 'failure_reason',
                label: 'Reason for Failure',
                type: 'textarea',
                required: true,
                placeholder: 'Describe why the inspection failed',
              },
              {
                id: 'root_cause',
                label: 'Root Cause',
                type: 'select',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Wear and Tear', value: 'wear' },
                    { label: 'Improper Use', value: 'misuse' },
                    { label: 'Manufacturing Defect', value: 'defect' },
                    { label: 'Environmental Factors', value: 'environment' },
                    { label: 'Other', value: 'other' },
                  ],
                },
              },
              {
                id: 'corrective_action',
                label: 'Corrective Action Required',
                type: 'textarea',
                required: true,
                placeholder: 'What needs to be done to fix this?',
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Failure Investigation Form');

  // Template 5: Critical Issue Response (for high severity)
  const criticalForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-critical-response-005' },
    update: {},
    create: {
      id: 'seed-critical-response-005',
      orgId: org.id,
      createdById: user.id,
      name: '🚨 Critical Issue Response',
      description: 'Emergency response for critical issues',
      category: 'emergency',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Emergency Response',
            fields: [
              {
                id: 'emergency_contact',
                label: 'Emergency Contact Notified',
                type: 'checkbox',
                required: true,
              },
              {
                id: 'contact_name',
                label: 'Contact Name',
                type: 'text',
                required: true,
                placeholder: 'Who was notified?',
              },
              {
                id: 'contact_time',
                label: 'Time of Contact',
                type: 'datetime',
                required: true,
              },
              {
                id: 'immediate_action',
                label: 'Immediate Action Taken',
                type: 'textarea',
                required: true,
                placeholder: 'What immediate steps were taken?',
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Critical Issue Response Form');

  // Template 6: Standard Completion (for pass status)
  const completionForm = await prisma.formTemplate.upsert({
    where: { id: 'seed-standard-completion-006' },
    update: {},
    create: {
      id: 'seed-standard-completion-006',
      orgId: org.id,
      createdById: user.id,
      name: '✅ Standard Completion',
      description: 'Standard completion form for passed inspections',
      category: 'completion',
      isPublic: false,
      isActive: true,
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Completion Details',
            fields: [
              {
                id: 'completion_date',
                label: 'Completion Date',
                type: 'date',
                required: true,
              },
              {
                id: 'inspector_signature',
                label: 'Inspector Name',
                type: 'text',
                required: true,
                placeholder: 'Your name',
              },
              {
                id: 'additional_notes',
                label: 'Additional Notes',
                type: 'textarea',
                required: false,
                placeholder: 'Any additional comments',
              },
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created: Standard Completion Form');

  console.log('\n✅ All test form templates created successfully!');
  console.log('\n📝 Summary:');
  console.log('  1. Equipment Inspection - Use inspection_status field for branching (pass/fail/review)');
  console.log('  2. Safety Checklist - Use ppe_required or hazards_present for boolean branching');
  console.log('  3. Issue Report - Use severity_level (number) or priority for branching');
  console.log('  4. Failure Investigation - Use as branch step when inspection fails');
  console.log('  5. Critical Issue Response - Use as branch step for critical/high priority');
  console.log('  6. Standard Completion - Use as branch step when inspection passes');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
