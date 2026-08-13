import crypto from 'node:crypto';
import path from 'node:path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import env from './env.js';
import ApiError from '../utils/ApiError.js';

let client = null;

if (env.storageEnabled) {
  client = new S3Client({
    region: env.SPACES_REGION,
    endpoint: env.SPACES_ENDPOINT,
    credentials: { accessKeyId: env.SPACES_KEY, secretAccessKey: env.SPACES_SECRET },
    forcePathStyle: false,
  });
}

export const storageReady = () => Boolean(client);

function publicUrl(key) {
  if (env.SPACES_CDN_URL) return `${env.SPACES_CDN_URL.replace(/\/$/, '')}/${key}`;
  const host = env.SPACES_ENDPOINT.replace(/^https?:\/\//, '');
  return `https://${env.SPACES_BUCKET}.${host}/${key}`;
}

/**
 * @param {{buffer: Buffer, originalname: string, mimetype: string}} file
 * @param {string} folder  e.g. 'audio' | 'images'
 */
export async function uploadFile(file, folder = 'uploads') {
  if (!client) throw ApiError.unavailable('Object storage is not configured on this server');

  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.SPACES_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return { key, url: publicUrl(key), size: file.buffer.length, mimeType: file.mimetype };
}

export async function deleteFile(key) {
  if (!client) throw ApiError.unavailable('Object storage is not configured on this server');
  await client.send(new DeleteObjectCommand({ Bucket: env.SPACES_BUCKET, Key: key }));
}

export default { storageReady, uploadFile, deleteFile };
