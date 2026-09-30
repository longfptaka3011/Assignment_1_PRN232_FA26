import { supabase, isSupabaseConfigured } from './supabase';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'zip', 'json'
];

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  contentType: string;
  downloadUrl?: string;
}

export const storageService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File size exceeds maximum allowed limit (10MB).' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File type .${ext} is not supported.` };
    }

    return { valid: true };
  },

  async uploadAttachment(
    file: File,
    projectId: string,
    issueId: string
  ): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${projectId}/${issueId}/${Date.now()}_${cleanFileName}`;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate signed URL (expires in 1 hour)
      const { data: signedData } = await supabase.storage
        .from('attachments')
        .createSignedUrl(data.path, 3600);

      return {
        fileName: file.name,
        filePath: data.path,
        fileSizeBytes: file.size,
        contentType: file.type || 'application/octet-stream',
        downloadUrl: signedData?.signedUrl
      };
    }

    // Local / Demo mode fallback: create object URL
    const objectUrl = URL.createObjectURL(file);
    return {
      fileName: file.name,
      filePath: storagePath,
      fileSizeBytes: file.size,
      contentType: file.type || 'application/octet-stream',
      downloadUrl: objectUrl
    };
  }
};
