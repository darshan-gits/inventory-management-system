const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ==============================
// GET STOCK HISTORY
// ==============================
router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                sh.id,
                p.name AS product_name,
                sh.quantity,
                sh.type,
                sh.remarks,
                sh.created_at
            FROM stock_history sh
            JOIN products p
                ON sh.product_id = p.id
            ORDER BY sh.created_at DESC
        `);

        res.json(rows);

    } catch (err) {

        console.error("History Error:", err);

        res.status(500).json({
            message: "Server Error",
            error: err.message
        });

    }

});

// ==============================
// EXPORT STOCK HISTORY TO EXCEL
// ==============================
router.get('/export', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                p.name AS product_name,
                sh.type,
                sh.quantity,
                sh.remarks,
                sh.created_at
            FROM stock_history sh
            JOIN products p
                ON sh.product_id = p.id
            ORDER BY sh.created_at DESC
        `);

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Stock History');

        worksheet.columns = [
            { header: 'Product', key: 'product_name', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 30 },
            { header: 'Date & Time', key: 'created_at', width: 25 }
        ];

        rows.forEach(row => worksheet.addRow(row));

        worksheet.getRow(1).font = { bold: true };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Stock_History_Report.xlsx'
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Export Failed'
        });

    }

});

// ==============================
// EXPORT STOCK HISTORY TO PDF
// ==============================
router.get('/pdf', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                p.name AS product_name,
                sh.type,
                sh.quantity,
                sh.remarks,
                sh.created_at
            FROM stock_history sh
            JOIN products p
                ON sh.product_id = p.id
            ORDER BY sh.created_at DESC
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
            'attachment; filename=Stock_History_Report.pdf'
        );

        doc.pipe(res);

        doc.fontSize(20)
            .text('Stock History Report', {
                align: 'center'
            });

        doc.moveDown();

        rows.forEach(row => {

            doc.fontSize(11);

            doc.text(`Product : ${row.product_name}`);
            doc.text(`Type : ${row.type}`);
            doc.text(`Quantity : ${row.quantity}`);
            doc.text(`Remarks : ${row.remarks}`);
            doc.text(`Date : ${new Date(row.created_at).toLocaleString()}`);

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