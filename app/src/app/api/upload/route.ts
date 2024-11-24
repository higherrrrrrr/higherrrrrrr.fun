import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/gcp/gcp-bucket-storage';


export async function POST(req: NextRequest) {
    try {
        // Get the form data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        // Validate file
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Upload to GCP
        const imageUrl = await storageService.uploadFile(file);

        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}
