import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Interface for Storage Provider
export class StorageProvider {
  /**
   * Upload file to storage
   * @param {Buffer | Blob | ReadableStream} fileContent
   * @param {string} key - File path/name
   * @param {string} contentType
   * @returns {Promise<{ url: string, key: string }>}
   */
  async upload(fileContent, key, contentType) { throw new Error("Not implemented"); }

  /**
   * Delete file from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) { throw new Error("Not implemented"); }

  /**
   * Get public URL for file
   * @param {string} key
   * @returns {string}
   */
  getUrl(key) { throw new Error("Not implemented"); }
}

// R2 Implementation (S3 Compatible)
export class R2Provider extends StorageProvider {
  constructor() {
    super();
    this.client = new S3Client({
      region: "auto",
      endpoint: config.storage.r2.endpoint,
      credentials: {
        accessKeyId: config.storage.r2.accessKeyId,
        secretAccessKey: config.storage.r2.secretAccessKey,
      },
    });
    this.bucket = config.storage.r2.bucket;
    this.publicUrl = config.storage.r2.publicUrl;
  }

  async upload(fileContent, key, contentType) {
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      }));
      return {
        url: this.getUrl(key),
        key: key
      };
    } catch (error) {
      logger.error({ event: "r2_upload_failed", error: error.message, key });
      throw error;
    }
  }

  async delete(key) {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (error) {
      logger.error({ event: "r2_delete_failed", error: error.message, key });
      throw error;
    }
  }

  getUrl(key) {
    return `${this.publicUrl}/${key}`;
  }
}

// DogeCloud/Upyun Implementation (S3 Compatible)
export class DogeProvider extends StorageProvider {
  constructor() {
    super();
    this.client = new S3Client({
      region: config.storage.doge.region || "auto",
      endpoint: config.storage.doge.endpoint,
      credentials: {
        accessKeyId: config.storage.doge.accessKeyId,
        secretAccessKey: config.storage.doge.secretAccessKey,
      },
    });
    this.bucket = config.storage.doge.bucket;
    this.publicUrl = config.storage.doge.publicUrl;
  }

  async upload(fileContent, key, contentType) {
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      }));
      return {
        url: this.getUrl(key),
        key: key
      };
    } catch (error) {
      logger.error({ event: "doge_upload_failed", error: error.message, key });
      throw error;
    }
  }

  async delete(key) {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (error) {
      logger.error({ event: "doge_delete_failed", error: error.message, key });
      throw error;
    }
  }

  getUrl(key) {
    return `${this.publicUrl}/${key}`;
  }
}

// Factory to get provider based on config
export const getStorageProvider = () => {
  const providerType = config.storage.provider || "r2";
  if (providerType === "doge") {
    return new DogeProvider();
  }
  return new R2Provider();
};
