const { S3Error } = require('minio');
const async = require('async');
const os = require('os');
const concat = require('concat-stream');
const { Readable } = require('stream');

// const downloadDest = os.homedir() + (os.platform() === 'win32' ? '\\Downloads\\' : '/Downloads/');

const deleteBucket = async (storage, bucketName) => {
  const objectsList = await listObjects(storage, bucketName);
  for (const objectName of objectsList) {
    await storage.removeObject(bucketName, objectName, (err) => {
      if (err) {
        console.error(`Error removing object ${objectName} from bucket ${bucketName}: ${err}`);
      } else {
        console.log(`Removed object ${objectName} from bucket ${bucketName}`);
      }
    }
    );
  }

  storage.removeBucket(bucketName, function(err) {
    if (err) {
      console.error('Error deleting bucket:', err);
    } else {
      console.log(`Bucket "${bucketName}" deleted successfully.`);
    }
  });
}

async function uploadToStorage(storage, bucketName, objectName, data) {
  try {
    if (!(await storage.bucketExists(bucketName))) {
      await storage.makeBucket(bucketName);
    }
  } catch (error) {
    console.log('INFO: bucket exists already');
  }
  try {
    await storage.putObject(bucketName, objectName, data, (err, etag) => {
      if (err) {
        return console.log(err, etag);
      }
      console.log('File uploaded successfully. ETag: ' + etag);
    });
  } catch (error) {
    throw error;
  }
}

function getChunkNumber(name) {
  const x = name.split('.chunk');
  const y = x[x.length - 1].split('of');
  return parseInt(y[0], 10);
}

async function listObjects(storage, bucketName) {
  const objectList = [];
  for await (const item of storage.listObjects(bucketName, '', true)) {
    objectList.push(item.name);
  }
  objectList.sort((a, b) => getChunkNumber(a) - getChunkNumber(b));
  return objectList;
}

async function getFilename(storage, bucketName) {
  const objectList = await listObjects(storage, bucketName);
  return objectList[0].split('.chunk')[0];
}

async function* getFileChunks(storage, bucketName) {
  const objectList = await listObjects(storage, bucketName);
  for (const objectName of objectList) {
    console.log(objectName, 'This')
    await storage.getObject(bucketName, objectName, (err, datastream) => {
      if (err) {
        console.log(err);
      }
      console.log(datastream, 'this')
      yield* datastream;
    });
  }
}

async function downloadAndConcatenate(storage, bucketName, objectName, objectContent, callback) {
  const objectStream = await storage.getObject(bucketName, objectName);
  objectStream.pipe(concat((data) => {
    objectContent.push(data);
    callback();
  }));
  objectStream.on('error', (err) => {
    console.error(`Error downloading object ${objectName}: ${err}`);
    callback(err);
  });
}

const getNames = async (storage, bucketList) => {
  let bucketNames = []
  for (let index = 0; index < bucketList.length; index++) {
    const objects = await listObjects(storage, bucketList[index].name)
    bucketNames.push(objects[0].split('.chunk')[0]) 
  }
  return bucketNames
}

module.exports = {
  uploadToStorage,
  getChunkNumber,
  listObjects,
  getFilename,
  getFileChunks,
  downloadAndConcatenate,
  getNames,
  deleteBucket,
};
