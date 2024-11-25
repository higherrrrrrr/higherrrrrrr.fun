import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

export class GCPStorageService {
    private storage: Storage;
    private bucket: string;

    constructor(bucketName: string = 'higherrrrrr-svgs') {
        this.bucket = bucketName;
        this.storage = new Storage();
    }

    async uploadFile(file: File): Promise<string> {
        try {
            if (!file.type.includes('svg')) {
                throw new Error('Only SVG files are allowed');
            }

            const filename = `${randomUUID()}.svg`;
            const buffer = await file.arrayBuffer().then(Buffer.from);
            const bucket = this.storage.bucket(this.bucket);
            const blob = bucket.file(filename);

            await blob.save(buffer, {
                contentType: 'image/svg+xml',
            });

            return `https://storage.googleapis.com/${this.bucket}/${filename}`;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file to GCP');
        }
    }
}

export const storageService = new GCPStorageService();
