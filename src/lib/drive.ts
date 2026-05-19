import { Attachment } from '@/types';

export function parseDriveLink(url: string, nameInput: string, userId: string): Attachment {
  let mimeType = 'unknown';
  let defaultName = 'Documento Anexo';

  if (url.includes('docs.google.com/document')) {
    mimeType = 'document';
    defaultName = 'Google Docs';
  } else if (url.includes('docs.google.com/spreadsheets')) {
    mimeType = 'spreadsheet';
    defaultName = 'Google Sheets';
  } else if (url.includes('docs.google.com/presentation')) {
    mimeType = 'presentation';
    defaultName = 'Google Slides';
  } else if (url.includes('drive.google.com/file') || url.includes('drive.google.com/open')) {
    mimeType = 'file';
    defaultName = 'Arquivo do Drive';
  } else if (url.includes('drive.google.com/drive/folders')) {
    mimeType = 'folder';
    defaultName = 'Pasta do Drive';
  }

  const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

  return {
    id,
    name: nameInput.trim() || defaultName,
    url: url.trim(),
    mimeType,
    addedBy: userId,
    addedAt: new Date(),
  };
}
