import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

type StorageBody = Uint8Array | NodeJS.ReadableStream;

const driver = process.env.STORAGE_DRIVER || "local";
const localRoot = path.resolve(
  /*turbopackIgnore: true*/
  process.cwd(),
  process.env.LOCAL_MEDIA_DIR || "storage/media"
);

function resolveLocalPath(key: string) {
  const target = path.resolve(/*turbopackIgnore: true*/ localRoot, ...key.split("/"));
  const rootWithSep = path.resolve(/*turbopackIgnore: true*/ localRoot) + path.sep;

  if (target !== path.resolve(localRoot) && !target.startsWith(rootWithSep)) {
    throw new Error("Invalid storage key");
  }

  return target;
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || undefined,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  credentials:
    process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
      : undefined
});

const bucket = process.env.S3_BUCKET || "blog-media";

async function putLocal(key: string, body: StorageBody) {
  const destination = resolveLocalPath(key);
  await fsPromises.mkdir(path.dirname(destination), { recursive: true });
  const source =
    body instanceof Uint8Array
      ? Readable.from(Buffer.from(body))
      : Readable.fromWeb(
          body as unknown as import("node:stream/web").ReadableStream
        );
  await pipeline(source, fs.createWriteStream(destination));
}

async function putS3(key: string, body: StorageBody) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body as never
    })
  );
}

async function getLocal(key: string) {
  return fsPromises.readFile(resolveLocalPath(key));
}

async function getS3(key: string) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );

  if (!result.Body) {
    throw new Error("Empty object");
  }

  const chunks: Uint8Array[] = [];

  for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function headLocal(key: string) {
  const stat = await fsPromises.stat(resolveLocalPath(key));
  return stat.size;
}

async function headS3(key: string) {
  const result = await s3.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
  return result.ContentLength ?? 0;
}

async function getRangeLocal(key: string, start: number, end: number) {
  const stream = fs.createReadStream(resolveLocalPath(key), { start, end });
  return Readable.toWeb(stream) as unknown as ReadableStream;
}

async function getRangeS3(key: string, start: number, end: number) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=${start}-${end}`
    })
  );

  if (!result.Body) {
    throw new Error("Empty object");
  }

  return Readable.toWeb(result.Body as Readable) as unknown as ReadableStream;
}

async function deleteLocal(key: string) {
  await fsPromises.rm(resolveLocalPath(key), { force: true });
}

async function deleteS3(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}

export const storage = {
  put(key: string, body: StorageBody) {
    return driver === "s3" ? putS3(key, body) : putLocal(key, body);
  },
  get(key: string) {
    return driver === "s3" ? getS3(key) : getLocal(key);
  },
  head(key: string) {
    return driver === "s3" ? headS3(key) : headLocal(key);
  },
  getRange(key: string, start: number, end: number) {
    return driver === "s3"
      ? getRangeS3(key, start, end)
      : getRangeLocal(key, start, end);
  },
  delete(key: string) {
    return driver === "s3" ? deleteS3(key) : deleteLocal(key);
  },
  isS3: driver === "s3"
};

export function publicMediaUrl(key: string) {
  return `/media/${key}`;
}
