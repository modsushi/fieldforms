import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample forms...');

  // Get the test organization
  const org = await prisma.organization.findFirst();
  const user = await prisma.user.findFirst();

  if (!org || !user) {
    console.error('❌ No organization or user found. Run the main seed first.');
    return;
  }

  // Sample Form 1: Contact Information
  const contactForm = await prisma.formTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      orgId: org.id,
      name: 'Contact Information Form',
      description: 'Basic contact details collection',
      category: 'General',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Personal Information',
            description: 'Please provide your contact details',
            fields: [
              {
                id: 'full_name',
                type: 'text',
                label: 'Full Name',
                required: true,
                placeholder: 'Enter your full name',
              },
              {
                id: 'email',
                type: 'text',
                label: 'Email Address',
                required: true,
                placeholder: 'you@example.com',
                helpText: 'We\'ll never share your email',
              },
              {
                id: 'phone',
                type: 'text',
                label: 'Phone Number',
                required: false,
                placeholder: '+1 (555) 123-4567',
              },
              {
                id: 'age',
                type: 'number',
                label: 'Age',
                required: false,
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Additional Information',
            fields: [
              {
                id: 'country',
                type: 'select',
                label: 'Country',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'United States', value: 'us' },
                    { label: 'Canada', value: 'ca' },
                    { label: 'United Kingdom', value: 'uk' },
                    { label: 'Australia', value: 'au' },
                  ],
                },
              },
              {
                id: 'subscribe',
                type: 'checkbox',
                label: 'Subscribe to newsletter',
                required: false,
              },
            ],
          },
        ],
      },
      createdBy: user.id,
    },
  });

  // Sample Form 2: Inspection Checklist
  const inspectionForm = await prisma.formTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      orgId: org.id,
      name: 'Site Inspection Checklist',
      description: 'Daily site inspection and safety check',
      category: 'Inspection',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Site Details',
            fields: [
              {
                id: 'site_name',
                type: 'text',
                label: 'Site Name',
                required: true,
              },
              {
                id: 'inspection_date',
                type: 'date',
                label: 'Inspection Date',
                required: true,
              },
              {
                id: 'inspector_name',
                type: 'text',
                label: 'Inspector Name',
                required: true,
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Safety Checks',
            fields: [
              {
                id: 'ppe_available',
                type: 'radio',
                label: 'Personal Protective Equipment Available?',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    { label: 'Partial', value: 'partial' },
                  ],
                },
              },
              {
                id: 'safety_hazards',
                type: 'textarea',
                label: 'Safety Hazards Identified',
                placeholder: 'Describe any safety concerns...',
                required: false,
              },
              {
                id: 'corrective_actions',
                type: 'textarea',
                label: 'Corrective Actions Taken',
                required: false,
              },
            ],
          },
          {
            id: 'section-3',
            title: 'Overall Assessment',
            fields: [
              {
                id: 'overall_rating',
                type: 'select',
                label: 'Overall Site Condition',
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
        ],
      },
      createdBy: user.id,
    },
  });

  // Sample Form 3: Customer Feedback
  const feedbackForm = await prisma.formTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      orgId: org.id,
      name: 'Customer Feedback Survey',
      description: 'Collect customer satisfaction feedback',
      category: 'Survey',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Your Experience',
            fields: [
              {
                id: 'service_rating',
                type: 'number',
                label: 'Rate our service (1-10)',
                required: true,
              },
              {
                id: 'recommend',
                type: 'radio',
                label: 'Would you recommend us?',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Definitely', value: 'definitely' },
                    { label: 'Probably', value: 'probably' },
                    { label: 'Not sure', value: 'not_sure' },
                    { label: 'Probably not', value: 'probably_not' },
                    { label: 'Definitely not', value: 'definitely_not' },
                  ],
                },
              },
              {
                id: 'comments',
                type: 'textarea',
                label: 'Additional Comments',
                placeholder: 'Tell us more about your experience...',
                required: false,
              },
              {
                id: 'follow_up',
                type: 'checkbox',
                label: 'I would like to be contacted about my feedback',
                required: false,
              },
            ],
          },
        ],
      },
      createdBy: user.id,
    },
  });

  // Sample Form 4: Conditional Logic Demo
  const conditionalForm = await prisma.formTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000104' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000104',
      orgId: org.id,
      name: 'Equipment Maintenance Report (with conditional logic)',
      description: 'Demonstrates conditional field visibility based on responses',
      category: 'Maintenance',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Equipment Information',
            fields: [
              {
                id: 'equipment_type',
                type: 'select',
                label: 'Equipment Type',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Generator', value: 'generator' },
                    { label: 'HVAC System', value: 'hvac' },
                    { label: 'Pump', value: 'pump' },
                    { label: 'Electrical Panel', value: 'electrical' },
                    { label: 'Other', value: 'other' },
                  ],
                },
              },
              {
                id: 'equipment_other',
                type: 'text',
                label: 'Please specify equipment type',
                required: true,
                visible: {
                  type: 'rule',
                  value: {
                    conditions: {
                      all: [
                        {
                          field: 'equipment_type',
                          operator: 'equals',
                          value: 'other',
                        },
                      ],
                    },
                  },
                },
                helpText: 'This field only appears when "Other" is selected above',
              },
              {
                id: 'issue_found',
                type: 'radio',
                label: 'Issue Found During Inspection?',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                  ],
                },
              },
            ],
          },
          {
            id: 'section-2',
            title: 'Issue Details',
            description: 'This section only appears if an issue was found',
            visible: {
              type: 'rule',
              value: {
                conditions: {
                  all: [
                    {
                      field: 'issue_found',
                      operator: 'equals',
                      value: 'yes',
                    },
                  ],
                },
              },
            },
            fields: [
              {
                id: 'issue_description',
                type: 'textarea',
                label: 'Describe the Issue',
                required: true,
                placeholder: 'Provide detailed description of the problem...',
              },
              {
                id: 'severity',
                type: 'select',
                label: 'Issue Severity',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Low - Can wait', value: 'low' },
                    { label: 'Medium - Schedule soon', value: 'medium' },
                    { label: 'High - Urgent attention needed', value: 'high' },
                    { label: 'Critical - Immediate action required', value: 'critical' },
                  ],
                },
              },
              {
                id: 'parts_needed',
                type: 'radio',
                label: 'Are replacement parts needed?',
                required: true,
                options: {
                  source: 'static',
                  value: [
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                  ],
                },
              },
              {
                id: 'parts_list',
                type: 'textarea',
                label: 'List Required Parts',
                required: true,
                placeholder: 'List all parts that need to be ordered...',
                visible: {
                  type: 'rule',
                  value: {
                    conditions: {
                      all: [
                        {
                          field: 'parts_needed',
                          operator: 'equals',
                          value: 'yes',
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
          {
            id: 'section-3',
            title: 'Photos and Documentation',
            fields: [
              {
                id: 'photo',
                type: 'photo',
                label: 'Equipment Photo',
                required: false,
                helpText: 'Take a photo of the equipment',
              },
              {
                id: 'notes',
                type: 'textarea',
                label: 'Additional Notes',
                required: false,
                placeholder: 'Any other relevant information...',
              },
            ],
          },
        ],
      },
      createdBy: user.id,
    },
  });

  console.log('✅ Created sample forms:');
  console.log(`  - ${contactForm.name}`);
  console.log(`  - ${inspectionForm.name}`);
  console.log(`  - ${feedbackForm.name}`);
  console.log(`  - ${conditionalForm.name} (with conditional logic)`);
  console.log('\n🎉 Sample forms created! Visit /dashboard/forms to see them.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

