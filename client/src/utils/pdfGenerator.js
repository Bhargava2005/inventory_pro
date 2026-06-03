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
      return 'Sale';
    });
    const uniqueStatuses = [...new Set(itemStatuses)];
    const hasSameStatus = uniqueStatuses.length === 1;
    const commonStatusRaw = hasSameStatus ? uniqueStatuses[0] : null;

    const statusMap = {
      'Sale': 'Sale',
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
    doc.text('Dispatch Details List', 14, 22);


    
    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let headerY = 28;
    doc.text(`Invoice #: ${sale.invoiceNumber}`, 140, headerY);
    headerY += 5;
    doc.text(`Date: ${date}`, 140, headerY);
    headerY += 5;
    doc.text(`Store: ${sale.storeId?.name || 'Main Branch'}`, 140, headerY);
    
    if (!hidePaymentMethod) {
      headerY += 5;
      doc.text(`Payment: ${sale.paymentMethod || 'N/A'}`, 140, headerY);
    }

    if (hasSameStatus && commonStatus) {
      headerY += 5;
      doc.text(`Voucher Type: ${commonStatus}`, 140, headerY);
    }

    // 2. Customer & Staff Details
    doc.setDrawColor(240);
    const lineY = headerY + 3;
    doc.line(14, lineY, 196, lineY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DISPATCH TO:', 14, lineY + 9);
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
    doc.text('DELIVERED BY:', 140, lineY + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.soldBy?.fullName || 'Staff Member', 140, lineY + 14);
    if (sale.soldBy?.username) doc.text(`ID: ${sale.soldBy.username}`, 140, lineY + 19);
    if (sale.soldBy?.phone) doc.text(`Mob: ${sale.soldBy.phone}`, 140, lineY + 24);

    // 3. Items Table
    const tableData = sale.items.map((item, index) => {
      const productUnit = (item.product?.unit || 'box').toLowerCase();
      const isBag = productUnit === 'bag';
      
      const ppb = item.product?.pieces_per_box || 1;
      const weightPerUnit = item.product?.weight_of_unit || 0;
      const calculatedWeight = item.weight || ( (item.quantity * weightPerUnit) + (item.pieces * (weightPerUnit / ppb)) );
      const calculatedPricePerPiece = item.pricePerPiece || (item.price / ppb);

      let displayStatus = 'Sale';
      if (item.isDamaged) displayStatus = 'DAMAGED';
      else if (item.isExchange) displayStatus = 'EXCHANGE';
      else if (item.isWrongProduct) displayStatus = 'WRONG PROD';
      else if (item.isSample) displayStatus = 'SAMPLE';
      
      const statusText = hasSameStatus ? '' : `\nStatus: ${displayStatus}`;
      const skuText = item.product?.sku ? `\n[SKU: ${item.product.sku}]` : '';
      const weightText = calculatedWeight > 0 ? `\nWeight: ${calculatedWeight.toFixed(2)} KG` : '';
      const productDesc = `${item.name}${skuText}${statusText}${weightText}`;

      const showPiecePrice = ppb > 1 && !isBag;
      
      let qtyParts = [];
      if (item.quantity > 0) {
        const unitLabel = item.quantity === 1 ? productUnit : (productUnit === 'box' ? 'boxes' : `${productUnit}s`);
        qtyParts.push(`${item.quantity} ${unitLabel}`);
      }
      if (!isBag && item.pieces > 0) {
        const piecesLabel = item.pieces === 1 ? 'piece' : 'pieces';
        qtyParts.push(`${item.pieces} ${piecesLabel}`);
      }
      if (!isBag && ppb > 1) {
        qtyParts.push(`(${ppb} pieces/box)`);
      }
      const qtyText = qtyParts.join('\n');

      const row = [
        index + 1,
        productDesc,
        { content: qtyText, styles: { fontStyle: 'bold', halign: 'right' } }
      ];

      if (!hidePrice) {
        row.push(
          `Rs. ${item.price.toLocaleString('en-IN')}${showPiecePrice ? `\n(Rs. ${calculatedPricePerPiece.toFixed(2)}/P)` : ''}`,
          `Rs. ${item.subtotal.toLocaleString('en-IN')}`
        );
      }

      return row;
    });

    const startTableY = lineY + 34;
    const tableHead = [['#', 'Product Description', 'Qty']];
    if (!hidePrice) {
      tableHead[0].push('Price', 'Total');
    }

    autoTable(doc, {
      startY: startTableY,
      head: tableHead,
      body: tableData,
      headStyles: { fillColor: [99, 102, 241], fontSize: 10 },
      columnStyles: hidePrice ? {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 140 },
        2: { halign: 'right', cellWidth: 35 }
      } : {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 90 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 30 }
      },
      styles: { fontSize: 9, font: 'helvetica', cellPadding: 3 },
      theme: 'striped',
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 0) data.cell.styles.halign = 'center';
          else if (data.column.index === 1) data.cell.styles.halign = 'left';
          else data.cell.styles.halign = 'right';
        }
      }
    });

    // 4. Totals & Transporter Details
    const rightEdge = 196;
    const labelX = 140;
    let finalY = doc.lastAutoTable.finalY + 10;

    const grandTotalWeight = tableData.reduce((sum, row) => {
      const weightMatch = row[1].match(/Weight: ([\d.]+) KG/);
      return sum + (weightMatch ? parseFloat(weightMatch[1]) : 0);
    }, 0);

    const totalQtyByUnit = sale.items.reduce((acc, item) => {
      const unit = (item.product?.unit || 'box').toLowerCase();
      acc[unit] = (acc[unit] || 0) + (item.quantity || 0);
      return acc;
    }, {});
    
    const totalPieces = sale.items.reduce((sum, item) => {
      const unit = (item.product?.unit || 'box').toLowerCase();
      return sum + (unit === 'bag' ? 0 : (item.pieces || 0));
    }, 0);

    // Order Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    let summaryY = finalY + 6;
    Object.entries(totalQtyByUnit).forEach(([unit, qty]) => {
      const label = qty === 1 ? unit : (unit.toLowerCase() === 'box' ? 'boxes' : `${unit}s`);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total ${label.charAt(0).toUpperCase() + label.slice(1)}:`, 14, summaryY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${qty}`, 40, summaryY);
      summaryY += 5;
    });
    
    if (totalPieces > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pieces:`, 14, summaryY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalPieces}`, 40, summaryY);
      summaryY += 5;
    }
    
    if (grandTotalWeight > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Weight:`, 14, summaryY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${grandTotalWeight.toFixed(2)} KG`, 40, summaryY);
    }

    let nextY = summaryY + 10;

    // Add Transporter Info if available
    if (sale.transporter?.vehicleNumber || sale.transporter?.vehicleType) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSPORTER / DELIVERY DETAILS', 14, nextY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Vehicle Type: ${sale.transporter.vehicleType || 'N/A'}`, 14, nextY + 6);
      doc.text(`Vehicle Number: ${sale.transporter.vehicleNumber || 'N/A'}`, 14, nextY + 11);
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
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241, 0.2); // Light watermarked indigo
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY PRO', 105, 270, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Inventory Management System', 105, 275, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, 281, { align: 'center' });
    doc.text('This is a computer generated invoice and does not require a signature.', 105, 286, { align: 'center' });

    // Download
    doc.save(`${sale.invoiceNumber}.pdf`);
    toast.success('Invoice downloaded!', { id: toastId });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    toast.error('Failed to generate PDF invoice', { id: toastId });
  }
};
