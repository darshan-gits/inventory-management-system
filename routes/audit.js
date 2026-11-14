const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { requireAdmin } = require('../middleware/authMiddleware');

// ==============================
// GET AUDIT LOGS
// ADMIN ONLY
// ==============================
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                username,
                action,
                table_affected,
                record_id,
                details,
                created_at
            FROM audit_log
            ORDER BY created_at DESC
        `);

        res.json(rows);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Database Error'
        });
    }
});

// ==============================
// EXPORT AUDIT TO EXCEL
// ADMIN ONLY
// ==============================
router.get('/export', requireAdmin, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT
                username,
                action,
                table_affected,
                record_id,
                details,
                created_at
            FROM audit_log
            ORDER BY created_at DESC
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Audit Report');

        worksheet.columns = [
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Action', key: 'action', width: 20 },
            { header: 'Module', key: 'table_affected', width: 20 },
            { header: 'Record ID', key: 'record_id', width: 15 },
            { header: 'Details', key: 'details', width: 50 },
            { header: 'Date & Time', key: 'created_at', width: 25 }
        ];

        logs.forEach(log => {
            worksheet.addRow(log);
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
            'attachment; filename=Audit_Report.xlsx'
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
// EXPORT AUDIT TO PDF
// ADMIN ONLY
// ==============================
router.get('/pdf', requireAdmin, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT
                username,
                action,
                table_affected,
                record_id,
                details,
                created_at
            FROM audit_log
            ORDER BY created_at DESC
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
            'attachment; filename=Audit_Report.pdf'
        );

        doc.pipe(res);

        doc.fontSize(20)
            .text('Audit Report', {
                align: 'center'
            });

        doc.moveDown();

        logs.forEach(log => {
            doc.fontSize(11);

            doc.text(`User : ${log.username}`);
            doc.text(`Action : ${log.action}`);
            doc.text(`Module : ${log.table_affected}`);
            doc.text(`Record ID : ${log.record_id ?? '-'}`);
            doc.text(`Details : ${log.details}`);
            doc.text(
                `Date : ${new Date(log.created_at).toLocaleString()}`
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