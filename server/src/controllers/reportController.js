import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

// @desc    Export inventory to Excel
// @route   GET /api/reports/inventory/export
// @access  Private (Admin, Manager)
export const exportInventory = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Total Value', key: 'value', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    products.forEach(p => {
      worksheet.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        price: p.price,
        quantity: p.quantity,
        unit: p.unit,
        value: p.price * p.quantity,
        status: p.stockStatus.toUpperCase(),
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export sales to Excel
// @route   GET /api/reports/sales/export
// @access  Private (Admin, Manager)
export const exportSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sales = await Sale.find(query)
      .populate('soldBy', 'fullName')
      .populate('storeId', 'name')
      .sort('-createdAt');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Invoice #', key: 'invoice', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Items Count', key: 'count', width: 12 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Sold By', key: 'staff', width: 20 },
      { header: 'Store', key: 'store', width: 20 },
    ];

    sales.forEach(s => {
      worksheet.addRow({
        invoice: s.invoiceNumber,
        date: s.createdAt.toLocaleString(),
        customer: s.customer?.name || 'Walk-in',
        count: s.items.length,
        payment: s.paymentMethod.toUpperCase(),
        total: s.totalAmount,
        staff: s.soldBy?.fullName,
        store: s.storeId?.name,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
