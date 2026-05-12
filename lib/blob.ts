'use server';

import { put, del } from '@vercel/blob';

export async function uploadFile(file: File, path: string) {
  try {
    const blob = await put(`accountify/${path}/${file.name}`, file, {
      access: 'private',
      multipart: true,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error('Blob upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file',
    };
  }
}

export async function deleteFile(pathname: string) {
  try {
    await del(pathname);
    return { success: true };
  } catch (error) {
    console.error('Blob delete error:', error);
    return {
      success: false,
      error: 'Failed to delete file',
    };
  }
}
