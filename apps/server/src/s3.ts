import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { S3_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } from './config'

export const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

export async function getS3File(key: string): Promise<Buffer | null> {
  try {
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    const res = await s3.send(cmd)
    if (!res.Body)
      return null

    const bytes = await res.Body.transformToByteArray()
    return Buffer.from(bytes)
  }
  catch (e: any) {
    if (e.name === 'NoSuchKey' || e.name === 'NotFound')
      return null
    throw e
  }
}

export async function putS3File(key: string, body: Buffer | string | Uint8Array, contentType?: string) {
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType })
  await s3.send(cmd)
}

export async function statS3File(key: string) {
  try {
    const cmd = new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })
    const res = await s3.send(cmd)
    return res
  }
  catch (e: any) {
    if (e.name === 'NotFound')
      return null
    throw e
  }
}
