
const path = require('path')
const fs = require('fs')
const {errorHandler} = require('../middleware/auth')
const {checkAuth} = require('../utils/features')
const {Certificate} = require('../models/pdf')
const NodeCache = require( "node-cache" ); 
const PDFDocument = require('pdfkit');
const {sendPushNotification} = require('../pushNotifications')

const myCache = new NodeCache();


exports.uploadCertificate = async (req, res) => {
  const {
    certificateName,
    certificateNumber,
    certificateProvider,
    obtainedDate,
    expireDate,
    deviceToken
  } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images found.' });
  }

  const imageFilenames = req.files.map(file => file.filename);

  const randomFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
  const pdfPath = `uploads/${randomFilename}`;

  const pdfDoc = new PDFDocument();
  pdfDoc.pipe(fs.createWriteStream(pdfPath));

  // Start from the first page for adding images
  let isFirstPage = true;

  for (const filename of imageFilenames) {
    if (!isFirstPage) {
      pdfDoc.addPage();
    }
    pdfDoc.image(`uploads/${filename}`, 10, 10, { width: 500 });
    isFirstPage = false;

    fs.unlink(`uploads/${filename}`, err => {
      if (err) {
        console.error(`Error deleting ${filename}: ${err}`);
      } else {
        console.log(`${filename} deleted successfully`);
      }
    });
  }

  // End the PDF after adding images
  pdfDoc.end();

  const certificate = new Certificate({
    certificateName,
    certificateNumber,
    certificateProvider,
    obtainedDate,
    expireDate,
    pdfPath: randomFilename, // Save the random filename in the database
    deviceToken, // Save the device token associated with the certificate
  });

  await certificate.save();

  sendPushNotification(deviceToken, `Your certificate "${certificateName}" is created.`);

  res.status(201).json({
    success: true,
    message: 'Certificate created and PDF saved successfully',
    certificate,
  });
};


exports.getCertificates = async  (req, res) => {
  const pdfs = await Certificate.find();
  res.json({ pdfs });
};

exports.getSpecificCertificates = async (req, res) => {
  const { filename } = req.params;
  const pdf = await Certificate.findOne({ filename });
  if (pdf) {
    const uploadsDirectory = path.resolve(__dirname, '../uploads');
    res.sendFile(filename, { root: uploadsDirectory });
  } else {
    res.status(404).json({ message: 'PDF not found' });
  }
};


// router.put('/api/certificates/:id', async (req, res) => {
  exports.updateCertificate= async (req, res) => {
      const { _id } = req.params;
      const {
        certificateName,
        certificateNumber,
        certificateProvider,
        obtainedDate,
        expireDate,
      } = req.body;
    
      try {
        // Find the certificate by its ID
        const certificate = await Certificate.findById(_id);
    
        if (!certificate) {
          return res.status(404).json({ error: 'Certificate not found.' });
        }
    
        // Update the certificate properties
        certificate.certificateName = certificateName;
        certificate.certificateNumber = certificateNumber;
        certificate.certificateProvider = certificateProvider;
        certificate.obtainedDate = obtainedDate;
        certificate.expireDate = expireDate;
    
        // Update images and PDF
        if (req.files && req.files.length > 0) {
          const imageFilenames = req.files.map(file => file.filename);
    
          const pdfFilename = `${id}.pdf`; // Use certificate ID as PDF filename
          const pdfPath = path.resolve(__dirname, `../uploads/${pdfFilename}`);
    
          const pdfDoc = new PDFDocument();
          pdfDoc.pipe(fs.createWriteStream(pdfPath));
    
          for (const filename of imageFilenames) {
            pdfDoc.addPage().image(path.resolve(__dirname, `../uploads/${filename}`), 10, 10, { width: 500 });
            fs.unlink(path.resolve(__dirname, `../uploads/${filename}`), err => {
              if (err) {
                console.error(`Error deleting ${filename}: ${err}`);
              } else {
                console.log(`${filename} deleted successfully`);
              }
            });
          }
    
          pdfDoc.end();
    
          certificate.pdfPath = pdfFilename; // Update PDF filename in the certificate
        }
    
        // Save the updated certificate
        const updatedCertificate = await certificate.save();
    
        res.status(200).json({
          success: true,
          message: 'Certificate updated successfully',
          certificate: updatedCertificate,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    };
    

    // router.delete('/api/certificates/:id', async (req, res) => {
  exports.deleteCertificate= async (req, res) => {
      const { _id } = req.params;
    
      try {
        // Find the certificate by its ID
        const certificate = await Certificate.findById(_id);
    
        if (!certificate) {
          return res.status(404).json({ error: 'Certificate not found.' });
        }
    
        // Delete the associated PDF file
        const pdfPath = path.resolve(__dirname, `../uploads/${certificate.pdfPath}`);
        fs.unlink(pdfPath, err => {
          if (err) {
            console.error(`Error deleting PDF: ${err}`);
          } else {
            console.log('PDF deleted successfully');
          }
        });
    
        // Delete the certificate from the database
        await certificate.remove();
    
        res.status(200).json({
          success: true,
          message: 'Certificate deleted successfully',
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    };




    // router.get('/api/expired-certificates', async (req, res) => {
  exports.expireCertificate= async (req, res) => {
      try {
        const currentDate = new Date();
        // Find all certificates where the expireDate is less than the current date
        const expiredCertificates = await Certificate.find({ expireDate: { $lt: currentDate } });
    
        res.status(200).json({
          success: true,
          message: 'Expired certificates retrieved successfully',
          expiredCertificates,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    };

    exports.expireCertificateThreeDays = async (req, res) => {
      try {
        const currentDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(currentDate.getDate() + 3); // Add 3 days to the current date
    
        // Find all certificates where the expireDate is within the next 3 days
        const expiringCertificates = await Certificate.find({
          expireDate: { $gte: currentDate, $lte: futureDate },
        });
    
        res.status(200).json({
          success: true,
          message: 'Certificates expiring within the next 3 days retrieved successfully',
          expiringCertificates,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    };
    


    
// router.get('/api/expiring-certificates', async (req, res) => {
  exports.expirecertificatePushNOtification = async (req, res) => {

  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 3); // Add 3 days to the current date

    // Find all certificates where the expireDate is within the next 3 days
    const expiringCertificates = await Certificate.find({
      expireDate: { $gte: currentDate, $lte: futureDate },
    });

    // Send push notifications for expiring certificates
    expiringCertificates.forEach(certificate => {
      sendPushNotification(certificate.deviceToken, `Your certificate "${certificate.certificateName}" is expiring soon.`);
    });

    res.status(200).json({
      success: true,
      message: 'Push notifications sent for expiring certificates',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};