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

export const generateInvoicePDF = (sale, options = {}) => {
  const { hidePrice = false, hideTax = false, hidePaymentMethod = false } = options;
  const toastId = toast.loading('Preparing your invoice...');
  
  try {
    const doc = jsPDF();
    const date = new Date(sale.createdAt).toLocaleDateString();

    // Determine if all items have the same status
    const itemStatuses = sale.items.map(item => {
      if (item.isDamaged) return 'DAMAGED';
      if (item.isExchange) return 'EXCHANGE';
      if (item.isWrongProduct) return 'WRONG PROD';
      if (item.isSample) return 'SAMPLE';
      return 'Selling';
    });
    const uniqueStatuses = [...new Set(itemStatuses)];
    const hasSameStatus = uniqueStatuses.length === 1;
    const commonStatusRaw = hasSameStatus ? uniqueStatuses[0] : null;

    const statusMap = {
      'Selling': 'Selling',
      'DAMAGED': 'Damaged',
      'EXCHANGE': 'Exchange',
      'WRONG PROD': 'Wrong Product',
      'SAMPLE': 'Sample'
    };
    const commonStatus = commonStatusRaw ? statusMap[commonStatusRaw] : null;

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
    doc.text(`Payment: ${hidePaymentMethod ? '***' : sale.paymentMethod || 'N/A'}`, 140, 43);
    if (hasSameStatus && commonStatus) {
      doc.text(`Voucher Type: ${commonStatus}`, 140, 48);
    }

    // 2. Customer & Staff Details
    doc.setDrawColor(240);
    const lineY = hasSameStatus ? 51 : 46;
    doc.line(14, lineY, 196, lineY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, lineY + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.customer?.name || 'Walk-in Customer', 14, lineY + 14);
    let billY = lineY + 19;
    if (sale.customer?.companyName) {
      doc.text(`Co.: ${sale.customer.companyName}`, 14, billY);
      billY += 5;
    }
    if (sale.customer?.phone) { doc.text(`Phone: ${sale.customer.phone}`, 14, billY); billY += 5; }
    if (sale.customer?.addressLine) { doc.text(`Addr: ${sale.customer.addressLine}`, 14, billY); }

    doc.setFont('helvetica', 'bold');
    doc.text('SOLD BY:', 140, lineY + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.soldBy?.fullName || 'Staff Member', 140, lineY + 14);
    if (sale.soldBy?.username) doc.text(`ID: ${sale.soldBy.username}`, 140, lineY + 19);
    if (sale.soldBy?.phone) doc.text(`Mob: ${sale.soldBy.phone}`, 140, lineY + 24);

    // 3. Items Table
    const tableData = sale.items.map((item, index) => {
      // Determine pieces_per_box and weight from item or fall back to product (for old sales)
      const ppb = item.product?.pieces_per_box || 1;
      const weightPerBox = item.product?.weight_of_box || 0;
      const calculatedWeight = item.weight || ( (item.quantity * weightPerBox) + (item.pieces * (weightPerBox / ppb)) );
      const calculatedPricePerPiece = item.pricePerPiece || (item.price / ppb);

      // Determine the display status
      let displayStatus = 'Selling';
      if (item.isDamaged) displayStatus = 'DAMAGED';
      else if (item.isExchange) displayStatus = 'EXCHANGE';
      else if (item.isWrongProduct) displayStatus = 'WRONG PROD';
      else if (item.isSample) displayStatus = 'SAMPLE';
      
      const statusText = hasSameStatus ? '' : `\nStatus: ${displayStatus}`;
      const skuText = item.product?.sku ? `\n[SKU: ${item.product.sku}]` : '';
      const weightText = calculatedWeight > 0 ? `\nWeight: ${calculatedWeight.toFixed(2)} KG` : '';
      const productDesc = `${item.name}${skuText}${statusText}${weightText}`;

      const showPiecePrice = ppb > 1;
      const boxesLabel = item.quantity === 1 ? 'box' : 'boxes';
      const piecesLabel = item.pieces === 1 ? 'piece' : 'pieces';
      const qtyText = `${item.quantity || 0} ${boxesLabel}\n${item.pieces || 0} ${piecesLabel}${showPiecePrice ? `\n(${ppb} pieces/box)` : ''}`;

      return [
        index + 1,
        productDesc,
        item.product?.dimensions || '—',
        { content: qtyText, styles: { fontStyle: 'bold', halign: 'center' } },
        hidePrice ? '***' : `Rs. ${item.price.toLocaleString('en-IN')}${showPiecePrice ? `\n(Rs. ${calculatedPricePerPiece.toFixed(2)}/P)` : ''}`,
        hidePrice ? '***' : `Rs. ${item.subtotal.toLocaleString('en-IN')}`
      ];
    });

    const startTableY = hasSameStatus ? 85 : 80;

    autoTable(doc, {
      startY: startTableY,
      head: [['#', 'Product Description', 'Dim.', 'Qty', 'Price', 'Total']],
      body: tableData,
      headStyles: { fillColor: [99, 102, 241], fontSize: 10, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 70 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 35 },
        5: { halign: 'right', cellWidth: 30 }
      },
      styles: { fontSize: 9, font: 'helvetica', cellPadding: 3 },
      theme: 'striped'
    });

    // 4. Totals & Transporter Details
    const rightEdge = 196;
    const labelX = 140;
    let finalY = doc.lastAutoTable.finalY + 10;

    // Calculate dynamic total weight from the processed rows to ensure consistency
    const grandTotalWeight = tableData.reduce((sum, row) => {
      const weightMatch = row[1].match(/Weight: ([\d.]+) KG/);
      return sum + (weightMatch ? parseFloat(weightMatch[1]) : 0);
    }, 0);

    const totalBoxes = sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPieces = sale.items.reduce((sum, item) => sum + (item.pieces || 0), 0);

    // Order Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Boxes:`, 14, finalY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalBoxes}`, 35, finalY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pieces:`, 14, finalY + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalPieces}`, 35, finalY + 11);
    
    if (grandTotalWeight > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Weight:`, 14, finalY + 16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${grandTotalWeight.toFixed(2)} KG`, 35, finalY + 16);
    }

    let nextY = finalY + (grandTotalWeight > 0 ? 24 : 19);

    // Add Transporter Info if available
    if (sale.transporter?.name) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSPORTER / DELIVERY DETAILS', 14, nextY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Driver Name: ${sale.transporter.name}`, 14, nextY + 6);
      doc.text(`Mobile: ${sale.transporter.mobile || 'N/A'}`, 14, nextY + 11);
      doc.text(`Vehicle: ${sale.transporter.vehicleType || 'N/A'} (${sale.transporter.vehicleNumber || 'N/A'})`, 14, nextY + 16);
    }

    if (!hidePrice) {
      const totalsStartX = 140;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', totalsStartX, doc.lastAutoTable.finalY + 10);
      doc.text(`Rs. ${(sale.totalAmount - (sale.tax || 0) + (sale.discount || 0)).toLocaleString('en-IN')}`, 196, doc.lastAutoTable.finalY + 10, { align: 'right' });

      let currentY = doc.lastAutoTable.finalY + 10;

      if (sale.tax > 0 && !hideTax) {
        currentY += 6;
        doc.text('Tax:', totalsStartX, currentY);
        doc.text(`+ Rs. ${sale.tax.toLocaleString('en-IN')}`, rightEdge, currentY, { align: 'right' });
      }

      if (sale.discount > 0) {
        currentY += 6;
        doc.text('Discount:', totalsStartX, currentY);
        doc.text(`- Rs. ${sale.discount.toLocaleString('en-IN')}`, rightEdge, currentY, { align: 'right' });
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
    }

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
