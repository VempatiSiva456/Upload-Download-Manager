const Minio = require('minio');
require('dotenv').config();

const MINIO_HOSTNAME = process.env.MINIO_HOSTNAME;
const MINIO_PORT = process.env.MINIO_PORT;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_IS_SECURE = process.env.MINIO_IS_SECURE === 'true';

const storage = new Minio.Client({
    endPoint: MINIO_HOSTNAME,
    port: parseInt(MINIO_PORT),
    useSSL: MINIO_IS_SECURE,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
});

module.exports = storage;
