import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface WorkOrderData {
  workOrder: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    createdAt: Date;
    completedAt?: Date;
    dueDate?: Date;
  };
  workflow: {
    name: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  claimedBy?: {
    name: string;
    email: string;
  };
  assignedToTeam?: {
    name: string;
  };
  submissions: Array<{
    id: string;
    formTemplate: { name: string };
    submittedAt: Date;
    submitter: { name: string };
    data: any;
  }>;
}

/**
 * Report Generator
 * Handles PDF and CSV export of work orders
 */
export class ReportGenerator {
  /**
   * Generate PDF report for a work order
   */
  async generatePDF(workOrderData: WorkOrderData): Promise<Blob> {
    const doc = new jsPDF();
    const { workOrder, workflow, createdBy, claimedBy, assignedToTeam, submissions } = workOrderData;

    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Work Order Report', 14, yPos);
    yPos += 10;

    // Work Order ID
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(`#${workOrder.id}`, 14, yPos);
    yPos += 15;

    // Work Order Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Work Order Details', 14, yPos);
    yPos += 8;

    const details = [
      ['Title', workOrder.title],
      ['Description', workOrder.description || 'N/A'],
      ['Status', workOrder.status],
      ['Priority', workOrder.priority],
      ['Workflow', workflow.name],
      ['Created By', `${createdBy.name} (${createdBy.email})`],
      ['Created At', new Date(workOrder.createdAt).toLocaleString()],
      ...(workOrder.dueDate ? [['Due Date', new Date(workOrder.dueDate).toLocaleString()]] : []),
      ...(workOrder.completedAt ? [['Completed At', new Date(workOrder.completedAt).toLocaleString()]] : []),
      ...(assignedToTeam ? [['Assigned Team', assignedToTeam.name]] : []),
      ...(claimedBy ? [['Claimed By', `${claimedBy.name} (${claimedBy.email})`]] : []),
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: details,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Form Submissions
    if (submissions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Form Submissions', 14, yPos);
      yPos += 8;

      submissions.forEach((submission, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${submission.formTemplate.name}`, 14, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128);
        doc.text(
          `Submitted by ${submission.submitter.name} on ${new Date(submission.submittedAt).toLocaleString()}`,
          14,
          yPos
        );
        yPos += 8;

        // Form Data
        const formData = Object.entries(submission.data).map(([key, value]) => [
          key,
          this.formatValueForPDF(value),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [],
          body: formData,
          theme: 'striped',
          styles: { fontSize: 9 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128);
      doc.text('No form submissions yet', 14, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    return doc.output('blob');
  }

  /**
   * Generate CSV report for a work order
   */
  async generateCSV(workOrderData: WorkOrderData): Promise<string> {
    const { workOrder, workflow, createdBy, claimedBy, assignedToTeam, submissions } = workOrderData;

    const rows: any[] = [];

    // Header row
    rows.push({
      'Work Order ID': workOrder.id,
      'Title': workOrder.title,
      'Description': workOrder.description || '',
      'Status': workOrder.status,
      'Priority': workOrder.priority,
      'Workflow': workflow.name,
      'Created By': createdBy.name,
      'Created At': new Date(workOrder.createdAt).toISOString(),
      'Due Date': workOrder.dueDate ? new Date(workOrder.dueDate).toISOString() : '',
      'Completed At': workOrder.completedAt ? new Date(workOrder.completedAt).toISOString() : '',
      'Assigned Team': assignedToTeam?.name || '',
      'Claimed By': claimedBy?.name || '',
    });

    // Add submission data rows
    submissions.forEach((submission) => {
      const submissionRow: any = {
        'Work Order ID': workOrder.id,
        'Submission ID': submission.id,
        'Form Template': submission.formTemplate.name,
        'Submitted By': submission.submitter.name,
        'Submitted At': new Date(submission.submittedAt).toISOString(),
      };

      // Add form field data
      Object.entries(submission.data).forEach(([key, value]) => {
        submissionRow[`Field: ${key}`] = this.formatValueForCSV(value);
      });

      rows.push(submissionRow);
    });

    return Papa.unparse(rows);
  }

  /**
   * Format value for PDF display
   */
  private formatValueForPDF(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  /**
   * Format value for CSV export
   */
  private formatValueForCSV(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  /**
   * Download PDF
   */
  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download CSV
   */
  downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();

