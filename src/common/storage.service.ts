import { Injectable, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import axios from 'axios';

@Injectable()
export class StorageService implements OnModuleInit {
  private storage;

  async onModuleInit() {
    const firebaseConfig = await this.fetchFirebaseConfig();
    const app = initializeApp({
      credential: cert(firebaseConfig),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    this.storage = getStorage(app).bucket();
  }

  private async fetchFirebaseConfig(): Promise<any> {
    const configUrl = process.env.FIREBASE_CONFIG_URL;
    if (!configUrl) {
      throw new Error(
        'FIREBASE_CONFIG_URL is not set in environment variables',
      );
    }

    const response = await axios.get(configUrl);
    return response.data;
  }

  async uploadFile(fileBuffer: Buffer, destination: string): Promise<string> {
    const file = this.storage.file(destination);
    await file.save(fileBuffer);

    return `https://storage.googleapis.com/${this.storage.name}/${destination}`;
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Generate a signed URL for temporary access
    const [url] = await this.storage.file(fileName).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    });
    return url;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.storage.file(fileName).delete();
  }

  async updateFileMetadata(fileName: string, metadata: any): Promise<void> {
    await this.storage.file(fileName).setMetadata(metadata);
  }
}
