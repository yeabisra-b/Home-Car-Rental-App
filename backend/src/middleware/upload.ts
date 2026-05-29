import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { createError } from './errorHandler';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const PDF_MIME_TYPES = ['application/pdf'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];

function resolveUploadDirectory(req: Request, file: Express.Multer.File): string {
  // Support both legacy routes and new centralized /api/v1/upload routes
  const path = req.originalUrl;

  if (file.fieldname === 'file') {
    if (path.includes('/auth') || path.includes('/user-profile')) {
      return 'uploads/profiles/';
    }

    if (path.includes('/leases') || path.includes('/lease-document')) {
      return 'uploads/leases/';
    }

    if (path.includes('/invoices') || path.includes('/payment-receipt')) {
      return 'uploads/receipts/';
    }

    if (path.includes('/maintenance-requests') || path.includes('/maintenance-evidence')) {
      return 'uploads/maintenance/';
    }

    return 'uploads/properties/';
  }

  if (file.fieldname === 'receipt') {
    return 'uploads/receipts/';
  }

  if (file.fieldname === 'document') {
    return 'uploads/documents/';
  }

  if (file.fieldname === 'evidence') {
    return 'uploads/evidence/';
  }

  return 'uploads/';
}

function getAllowedMimeTypes(req: Request): string[] {
  const path = req.originalUrl;

  if (path.includes('/auth') || path.includes('/user-profile')) {
    return IMAGE_MIME_TYPES;
  }

  if (path.includes('/leases') || path.includes('/lease-document')) {
    return PDF_MIME_TYPES;
  }

  if (path.includes('/invoices') || path.includes('/payment-receipt')) {
    return [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES];
  }

  if (path.includes('/maintenance-requests') || path.includes('/maintenance-evidence')) {
    return [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES];
  }

  return [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES, ...VIDEO_MIME_TYPES];
}

function sanitizeFilename(input: string): string {
  const sanitized = input
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized || 'upload';
}

async function readFileHeader(filePath: string, length: number = 16): Promise<Buffer> {
  const handle = await fs.promises.open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    return buffer;
  } finally {
    await handle.close();
  }
}

function hasPdfSignature(header: Buffer): boolean {
  return header.subarray(0, 5).toString() === '%PDF-';
}

function hasJpegSignature(header: Buffer): boolean {
  return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
}

function hasPngSignature(header: Buffer): boolean {
  return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function hasGifSignature(header: Buffer): boolean {
  const signature = header.subarray(0, 6).toString();
  return signature === 'GIF87a' || signature === 'GIF89a';
}

function hasWebpSignature(header: Buffer): boolean {
  return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
}

function hasMp4LikeSignature(header: Buffer): boolean {
  return header.subarray(4, 8).toString() === 'ftyp';
}

function hasAviSignature(header: Buffer): boolean {
  return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'AVI ';
}

async function validateFileSignature(file: Express.Multer.File): Promise<boolean> {
  const header = await readFileHeader(file.path, 16);

  switch (file.mimetype) {
    case 'application/pdf':
      return hasPdfSignature(header);
    case 'image/jpeg':
    case 'image/jpg':
      return hasJpegSignature(header);
    case 'image/png':
      return hasPngSignature(header);
    case 'image/gif':
      return hasGifSignature(header);
    case 'image/webp':
      return hasWebpSignature(header);
    case 'video/mp4':
    case 'video/mov':
    case 'video/quicktime':
      return hasMp4LikeSignature(header);
    case 'video/avi':
      return hasAviSignature(header);
    default:
      return false;
  }
}

async function removeUploadedFile(file: Express.Multer.File): Promise<void> {
  await fs.promises.unlink(file.path).catch(() => undefined);
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = resolveUploadDirectory(req, file);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${name}-${uniqueSuffix}${ext.toLowerCase()}`);
  },
});

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = getAllowedMimeTypes(req);

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type for this endpoint.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: Request, res: any, next: any) => {
    const singleUpload = upload.single(fieldName);

    singleUpload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError('File size too large. Maximum size is 10MB.', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createError('Too many files. Maximum is 5 files per request.', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(createError('Unexpected file field.', 400));
        }
        return next(createError(`Upload error: ${err.message}`, 400));
      } else if (err) {
        return next(createError(`Upload error: ${err.message}`, 400));
      }

      if (!req.file) {
        return next();
      }

      void validateFileSignature(req.file)
        .then(async (isValid) => {
          if (!isValid) {
            await removeUploadedFile(req.file as Express.Multer.File);
            return next(createError('Uploaded file content does not match the declared file type.', 400));
          }

          next();
        })
        .catch(async (signatureError) => {
          await removeUploadedFile(req.file as Express.Multer.File);
          next(createError(`Upload error: ${signatureError.message}`, 400));
        });
    });
  };
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => {
  return (req: Request, res: any, next: any) => {
    const multipleUpload = upload.array(fieldName, maxCount);

    multipleUpload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError('File size too large. Maximum size is 10MB.', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createError(`Too many files. Maximum is ${maxCount} files per request.`, 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(createError('Unexpected file field.', 400));
        }
        return next(createError(`Upload error: ${err.message}`, 400));
      } else if (err) {
        return next(createError(`Upload error: ${err.message}`, 400));
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        return next();
      }

      void Promise.all(files.map(async (file) => {
        const isValid = await validateFileSignature(file);
        if (!isValid) {
          await removeUploadedFile(file);
          throw new Error('Uploaded file content does not match the declared file type.');
        }
      }))
        .then(() => next())
        .catch(async (signatureError) => {
          await Promise.all(files.map(removeUploadedFile));
          next(createError(`Upload error: ${signatureError.message}`, 400));
        });
    });
  };
};

// Helper function to determine media type from MIME type
export const getMediaType = (mimeType: string): 'IMAGE' | 'DOCUMENT' | 'VIDEO' => {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  } else if (mimeType === 'application/pdf') {
    return 'DOCUMENT';
  } else if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  } else {
    return 'IMAGE'; // Default fallback
  }
};

export default upload;
