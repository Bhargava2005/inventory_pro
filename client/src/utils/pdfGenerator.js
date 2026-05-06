import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (sale) => {
  const doc = jsPDF();
  const date = new Date(sale.createdAt).toLocaleDateString();

  // 1. Header & Branding
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241); // Primary Indigo
  doc.text('INVENTORY PRO', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Smart Inventory Management System', 14, 28);

  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('TAX INVOICE', 140, 22);
  
  doc.setFontSize(9);
  doc.text(`Invoice #: ${sale.invoiceNumber}`, 140, 28);
  doc.text(`Date: ${date}`, 140, 33);
  doc.text(`Store: ${sale.storeId?.name || 'Main Branch'}`, 140, 38);

  // 2. Customer & Staff Details
  doc.setDrawColor(240);
  doc.line(14, 45, 196, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.customer?.name || 'Walk-in Customer', 14, 60);
  if (sale.customer?.phone) doc.text(`Phone: ${sale.customer.phone}`, 14, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('SOLD BY:', 140, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.soldBy?.fullName || 'Staff', 140, 60);

  // 3. Items Table
  const tableData = sale.items.map(item => [
    item.name,
    `₹${item.price.toFixed(2)}`,
    item.quantity,
    `₹${item.subtotal.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 75,
    head: [['Product Description', 'Price', 'Qty', 'Total']],
    body: tableData,
    headStyles: { fillColor: [99, 102, 241], fontSize: 10, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' }
    },
    theme: 'striped'
  });

  // 4. Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, finalY);
  doc.text(`₹${sale.totalAmount.toFixed(2)}`, 180, finalY, { align: 'right' });

  if (sale.discount > 0) {
    doc.text('Discount:', 140, finalY + 5);
    doc.text(`- ₹${sale.discount.toFixed(2)}`, 180, finalY + 5, { align: 'right' });
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('TOTAL AMOUNT:', 140, finalY + 12);
  doc.text(`₹${sale.totalAmount.toFixed(2)}`, 180, finalY + 12, { align: 'right' });

  // 5. Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('This is a computer generated invoice.', 105, 285, { align: 'center' });

  // Download
  doc.save(`${sale.invoiceNumber}.pdf`);
};
