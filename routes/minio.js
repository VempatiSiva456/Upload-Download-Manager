const express = require('express');
const { Readable } = require('stream');
const { Minio, S3Error } = require('minio');
const storage = require('../source/storage');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const concat = require('concat-stream');

const store = multer.memoryStorage();
const upload = multer({ storage: store });
// const downloadDest = os.homedir() + (os.platform() === 'win32' ? '\\Downloads\\' : '/Downloads/');

const {
  uploadToStorage,
  listObjects,
  getFilename,
  downloadAndConcatenate,
  getNames,
  deleteBucket,
} = require('../source/utils');

const CHUNK_SIZE = process.env.CHUNK_SIZE || 10 * 1024 * 1024;

const minioRouter = express.Router();

minioRouter.get('/', (req, res) => {
  res.render('index.ejs');
});

minioRouter.get('/download', async (req, res) => {
  try {
    const bucketList = await storage.listBuckets();
    bucketNames = await getNames(storage, bucketList)
    let info = []
    for (let index = 0; index < bucketNames.length; index++) {
      info.push({'url': bucketList[index].name, 'name': bucketNames[index]})
    }
    res.json(info);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

minioRouter.get('/download/:bucket_name', async (req, res) => {
  const bucketName = req.params.bucket_name;
  const objectList = await listObjects(storage, bucketName);
  const objectContent = [];
  let currentIndex = 0;

  async function downloadAndMergeNextObject() {
    if (currentIndex < objectList.length) {
      const objectName = objectList[currentIndex];
      downloadAndConcatenate(storage, bucketName, objectName, objectContent, (err) => {
        if (err) {
          res.statusCode = 500;
          res.end('Error downloading objects');
          return;
        }
        currentIndex++;
        downloadAndMergeNextObject();
      });
    } 
    else {
      const filename = await getFilename(storage, bucketName)
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      console.log("Downloaded")
      res.end(Buffer.concat(objectContent));
    }
  }

  downloadAndMergeNextObject();
})

minioRouter.delete('/delete/:bucket_name', async (req, res) => {
  const bucketName = req.params.bucket_name;
  await deleteBucket(storage, bucketName)
  res.status(200).json({ success: true });
})

minioRouter.post('/upload', upload.single("chunk"), (req, res) => {
  const chunk = req.file;
  const originalFileId = req.body.originalFileId;

  if (!chunk) {
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
  uploadToStorage(storage, originalFileId, chunk.originalname, chunk.buffer)
    .then((success) => {
      if (success) {
        res.status(201).json({ success: true });
      } else {
        res.status(500).json({ success: false, message: 'File upload failed' });
      }
    })
    .catch((error) => {
      res.status(500).json({ success: false, error: error.message });
    });
});

module.exports = minioRouter;
