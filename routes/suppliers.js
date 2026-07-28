const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logAction = require('../utils/auditLogger');

// =========================
// GET ALL SUPPLIERS
// =========================
router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(
            'SELECT * FROM suppliers ORDER BY id DESC'
        );

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Database Error'
        });

    }

});

// =========================
// EXPORT SUPPLIERS TO EXCEL
// =========================
router.get('/export', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                supplier_name,
                contact_person,
                phone,
                email,
                address
            FROM suppliers
            ORDER BY supplier_name
        `);

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('Suppliers');

        worksheet.columns = [
            { header: 'Supplier Name', key: 'supplier_name', width: 30 },
            { header: 'Contact Person', key: 'contact_person', width: 25 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Email', key: 'email', width: 35 },
            { header: 'Address', key: 'address', width: 40 }
        ];

        rows.forEach(row => worksheet.addRow(row));

        worksheet.getRow(1).font = { bold: true };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Suppliers_Report.xlsx'
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

// =========================
// EXPORT SUPPLIERS TO PDF
// =========================
router.get('/pdf', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                supplier_name,
                contact_person,
                phone,
                email,
                address
            FROM suppliers
            ORDER BY supplier_name
        `);

        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });

        res.setHeader('Content-Type', 'application/pdf');

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=Suppliers_Report.pdf'
        );

        doc.pipe(res);

        doc.fontSize(20)
            .text('Suppliers Report', {
                align: 'center'
            });

        doc.moveDown();

        rows.forEach(row => {

            doc.fontSize(11);

            doc.text(`Supplier : ${row.supplier_name}`);
            doc.text(`Contact : ${row.contact_person}`);
            doc.text(`Phone : ${row.phone}`);
            doc.text(`Email : ${row.email}`);
            doc.text(`Address : ${row.address}`);

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

// =========================
// ADD SUPPLIER
// =========================
router.post('/', async (req, res) => {

    try {

        const {
            supplier_name,
            contact_person,
            phone,
            email,
            address
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO suppliers
            (supplier_name, contact_person, phone, email, address)
            VALUES (?, ?, ?, ?, ?)`,
            [
                supplier_name,
                contact_person,
                phone,
                email,
                address
            ]
        );

        await logAction(
            req.session.username,
            'CREATE',
            'suppliers',
            result.insertId,
            `Added supplier: ${supplier_name}`
        );

        res.json({
            message: 'Supplier added successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Database Error'
        });

    }

});

// =========================
// UPDATE SUPPLIER
// =========================
router.put('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const {
            supplier_name,
            contact_person,
            phone,
            email,
            address
        } = req.body;

        await pool.query(
            `UPDATE suppliers
             SET supplier_name=?,
                 contact_person=?,
                 phone=?,
                 email=?,
                 address=?
             WHERE id=?`,
            [
                supplier_name,
                contact_person,
                phone,
                email,
                address,
                id
            ]
        );

        await logAction(
            req.session.username,
            'UPDATE',
            'suppliers',
            id,
            `Updated supplier: ${supplier_name}`
        );

        res.json({
            message: 'Supplier updated successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Database Error'
        });

    }

});

// =========================
// DELETE SUPPLIER
// =========================
router.delete('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [supplier] = await pool.query(
            'SELECT supplier_name FROM suppliers WHERE id=?',
            [id]
        );

        await pool.query(
            'DELETE FROM suppliers WHERE id=?',
            [id]
        );

        await logAction(
            req.session.username,
            'DELETE',
            'suppliers',
            id,
            `Deleted supplier: ${supplier.length ? supplier[0].supplier_name : id}`
        );

        res.json({
            message: 'Supplier deleted successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Database Error'
        });

    }

});

module.exports = router;