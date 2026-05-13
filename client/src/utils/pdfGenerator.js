import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const generateMismatchReportPDF = (mismatchedProducts, user) => {
  const toastId = toast.loading('Preparing mismatch report...');
  
  try {
    const doc = jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // Red
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY PRO', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Inventory Management System', 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text('MISMATCH REPORT', 140, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${date}`, 140, 28);
    doc.text(`Total Mismatches: ${mismatchedProducts.length}`, 140, 33);

    if (user) {
      doc.text(`Manager: ${user.fullName || 'N/A'}`, 140, 38);
      doc.text(`Mobile: ${user.phone || 'N/A'}`, 140, 43);
      doc.text(`Branch: ${user.branchId?.name || user.storeId?.name || 'Main Branch'}`, 140, 48);
    }

    const tableData = mismatchedProducts.map(prod => [
      prod.sku || 'N/A',
      prod.name,
      prod.category?.name || 'General',
      prod.quantity.toString()
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['SKU', 'Product Name', 'Category', 'System Stock']],
      body: tableData,
      headStyles: { fillColor: [220, 38, 38], fontSize: 10, halign: 'left' },
      styles: { fontSize: 9, font: 'helvetica' },
      theme: 'striped'
    });

    doc.save(`Mismatch_Report_${date.replaceAll('/', '-')}.pdf`);
    toast.success('Report downloaded!', { id: toastId });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    toast.error('Failed to generate report', { id: toastId });
  }
};

export const generateInvoicePDF = (sale) => {
  const toastId = toast.loading('Preparing your invoice...');
  
  try {
    const doc = jsPDF();
    const date = new Date(sale.createdAt).toLocaleDateString();

    // 1. Header & Branding
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Primary Indigo
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY PRO', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Inventory Management System', 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 140, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
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
    let billY = 65;
    if (sale.customer?.companyName) {
      doc.text(`Co.: ${sale.customer.companyName}`, 14, billY);
      billY += 5;
    }
    if (sale.customer?.phone) { doc.text(`Phone: ${sale.customer.phone}`, 14, billY); billY += 5; }
    if (sale.customer?.addressLine) { doc.text(`Addr: ${sale.customer.addressLine}`, 14, billY); }

    doc.setFont('helvetica', 'bold');
    doc.text('SOLD BY:', 140, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.soldBy?.fullName || 'Staff Member', 140, 60);
    if (sale.soldBy?.username) doc.text(`ID: ${sale.soldBy.username}`, 140, 65);
    if (sale.soldBy?.phone) doc.text(`Mob: ${sale.soldBy.phone}`, 140, 70);

    // 3. Items Table
    const tableData = sale.items.map(item => {
      const statuses = [];
      if (item.isDamaged) statuses.push('DAMAGED');
      if (item.isExchange) statuses.push('EXCHANGE');
      if (item.isWrongProduct) statuses.push('WRONG PROD');
      if (item.isSample) statuses.push('SAMPLE');
      
      const statusText = statuses.length > 0 ? ` (${statuses.join(', ')})` : '';
      const skuText = item.product?.sku ? ` [SKU: ${item.product.sku}]` : '';
      const brandText = item.product?.brand ? ` | Brand: ${item.product.brand}` : '';
      const categoryText = item.product?.category?.name ? ` | Category: ${item.product.category.name}` : '';

      return [
        '', // Color indicator placeholder
        `${item.name}${skuText}${statusText}${brandText}${categoryText}`,
        `${item.price.toLocaleString('en-IN')}`,
        item.quantity,
        `${item.subtotal.toLocaleString('en-IN')}`
      ];
    });

    autoTable(doc, {
      startY: 80,
      head: [['', 'Product Description', 'Price (Rs.)', 'Qty', 'Total (Rs.)']],
      body: tableData,
      headStyles: { fillColor: [99, 102, 241], fontSize: 10, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8 }, // Color box
        1: { cellWidth: 82 },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      },
      styles: { fontSize: 9, font: 'helvetica' },
      theme: 'striped',
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const item = sale.items[data.row.index];
          const color = item.product?.color || '#3b82f6';
          
          // Draw a small rounded color box
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          doc.setFillColor(r, g, b);
          doc.roundedRect(data.cell.x + 2, data.cell.y + 2, 4, 4, 1, 1, 'F');
        }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw.includes('(')) {
            data.cell.styles.textColor = [220, 38, 38]; // Red for alert statuses
          }
        }
      }
    });

    // 4. Totals
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
    const rightEdge = 196;
    const labelX = 140;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    
    // Subtotal
    doc.text('Subtotal:', labelX, finalY);
    doc.text(`${(sale.totalAmount - (sale.tax || 0) + (sale.discount || 0)).toLocaleString('en-IN')}`, rightEdge, finalY, { align: 'right' });

    let currentY = finalY;

    if (sale.tax > 0) {
      currentY += 6;
      doc.text('Tax:', labelX, currentY);
      doc.text(`+ ${sale.tax.toLocaleString('en-IN')}`, rightEdge, currentY, { align: 'right' });
    }

    if (sale.discount > 0) {
      currentY += 6;
      doc.text('Discount:', labelX, currentY);
      doc.text(`- ${sale.discount.toLocaleString('en-IN')}`, rightEdge, currentY, { align: 'right' });
    }

    // Total Amount
    currentY += 10;
    doc.setDrawColor(200);
    doc.line(labelX, currentY - 5, rightEdge, currentY - 5);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('TOTAL AMOUNT:', labelX, currentY);
    doc.text(`Rs. ${sale.totalAmount.toLocaleString('en-IN')}`, rightEdge, currentY, { align: 'right' });

    // 5. Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    doc.text('This is a computer generated invoice and does not require a signature.', 105, 285, { align: 'center' });

    // Download
    doc.save(`${sale.invoiceNumber}.pdf`);
    toast.success('Invoice downloaded!', { id: toastId });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    toast.error('Failed to generate PDF invoice', { id: toastId });
  }
};
