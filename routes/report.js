const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');

// Export Products to Excel
router.get('/products', async (req, res) => {

    try {

        const [products] = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.quantity,
                p.unit_price,
                p.reorder_level,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
            ON p.category_id = c.id
            ORDER BY p.id
        `);

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Product', key: 'name', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Price', key: 'unit_price', width: 15 },
            { header: 'Reorder Level', key: 'reorder_level', width: 20 },
            { header: 'Category', key: 'category', width: 25 }
        ];

        products.forEach(product => {
            worksheet.addRow(product);
        });

        worksheet.getRow(1).font = {
            bold: true
        };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Inventory_Report.xlsx'
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Excel Export Failed'
        });

    }

});
// ====================================
// Export Products to PDF
// ====================================
router.get('/products/pdf', async (req, res) => {

    try {

        const [products] = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.quantity,
                p.unit_price,
                p.reorder_level,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
            ON p.category_id = c.id
            ORDER BY p.id
        `);

        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Inventory_Report.pdf'
        );

        doc.pipe(res);

        doc.fontSize(20).text('Inventory Report', {
            align: 'center'
        });

        doc.moveDown();

        doc.fontSize(12);

        products.forEach(product => {

            doc.text(
                `ID: ${product.id}`
            );

            doc.text(
                `Product: ${product.name}`
            );

            doc.text(
                `Quantity: ${product.quantity}`
            );

            doc.text(
                `Price: ₹${product.unit_price}`
            );

            doc.text(
                `Reorder Level: ${product.reorder_level}`
            );

            doc.text(
                `Category: ${product.category || '-'}`
            );

            doc.moveDown();

        });

        doc.end();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'PDF Export Failed'
        });

    }

});
module.exports = router;