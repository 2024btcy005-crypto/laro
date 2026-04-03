const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const xeroxUpload = require('../config/xeroxMulterConfig');
const { protect, admin } = require('../middlewares/authMiddleware');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

// @desc    Upload product image (admin)
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ message: 'Image uploaded successfully', url: imageUrl });
});

// @desc    Upload a file for xerox/printing order
// @route   POST /api/upload/xerox
// @access  Private (any customer)
router.post('/xerox', protect, xeroxUpload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    let filePath = req.file.path;
    let mimeType = req.file.mimetype;
    let fileName = req.file.filename;

    // Conversion Logic (Native Office via PowerShell)
    const ext = req.file.originalname.toLowerCase().split('.').pop();
    if (['docx', 'doc', 'pptx', 'ppt'].includes(ext)) {
        console.log(`[XeroxUpload] Converting ${ext} to PDF via Native Office...`);
        try {
            const uniquePdfName = `converted_${Date.now()}_${Math.round(Math.random() * 1E9)}.pdf`;
            const newPdfPath = `uploads/xerox/${uniquePdfName}`;

            // Requires absolute paths for Office COM objects to work reliably
            const path = require('path');
            const absInputPath = path.resolve(filePath);
            const absOutputPath = path.resolve(newPdfPath);
            const scriptPath = path.resolve('scripts/convert_office.ps1');

            const performConversion = async () => {
                // TRY ENGINE 1: Native Microsoft Office (Windows Only, 100% Fidelity)
                try {
                    const { exec } = require('child_process');
                    await new Promise((resolve, reject) => {
                        const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -InputPath "${absInputPath}" -OutputPath "${absOutputPath}"`;
                        exec(cmd, (err) => err ? reject(err) : resolve());
                    });
                    console.log('[XeroxUpload] Native conversion successful.');
                    return;
                } catch (e) {
                    console.log('[XeroxUpload] Native engine not found or failed.');
                }

                // TRY ENGINE 2: LibreOffice (Cross-platform, High Fidelity, Free)
                try {
                    const libre = require('libreoffice-convert');
                    const fileBuf = fs.readFileSync(filePath);
                    await new Promise((resolve, reject) => {
                        libre.convert(fileBuf, '.pdf', undefined, (err, done) => {
                            if (err) reject(err);
                            else {
                                fs.writeFileSync(newPdfPath, done);
                                resolve();
                            }
                        });
                    });
                    console.log('[XeroxUpload] LibreOffice conversion successful.');
                    return;
                } catch (e) {
                    console.log('[XeroxUpload] LibreOffice not found or failed.');
                }

                // TRY ENGINE 3: Pure JS (Fallback, Last Resort)
                console.log('[XeroxUpload] Using JS library fallback...');
                if (ext === 'docx' || ext === 'doc') {
                    const docxConverter = require('docx-pdf');
                    await new Promise((res, rej) => {
                        docxConverter(filePath, newPdfPath, (e, r) => e ? rej(e) : res(r));
                    });
                } else if (ext === 'pptx' || ext === 'ppt') {
                    const pptxConverter = require('pptx-to-pdf');
                    const pptBuffer = fs.readFileSync(filePath);
                    const pdfBuffer = await pptxConverter(pptBuffer);
                    fs.writeFileSync(newPdfPath, pdfBuffer);
                }
            };

            await performConversion();

            // Update variables to use the new PDF
            filePath = newPdfPath;
            mimeType = 'application/pdf';
            fileName = uniquePdfName;
            console.log('[XeroxUpload] Native conversion successful, new path:', filePath);
        } catch (convErr) {
            console.error('[XeroxUpload] Native conversion failed, falling back to original:', convErr);
        }
    }

    let pageCount = 1;
    console.log('[XeroxUpload] Final MIME:', mimeType, 'Path:', filePath);
    if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
        try {
            const pdfBuffer = fs.readFileSync(filePath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            pageCount = pdfDoc.getPageCount();
            console.log('[XeroxUpload] PDF page count:', pageCount);
        } catch (err) {
            console.error('[XeroxUpload] Error counting PDF pages:', err);
            pageCount = 1;
        }
    }

    const fileUrl = `/uploads/xerox/${fileName}`;
    res.json({
        message: 'File uploaded successfully',
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        pageCount: pageCount
    });
});

module.exports = router;
