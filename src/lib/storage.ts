import { storage, auth } from '@/firebase/config';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

function getUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Käyttäjä ei ole kirjautunut');
  return uid;
}

export async function uploadAttachment(
  entryId: string,
  attachmentId: string,
  fileName: string,
  dataUrl: string
): Promise<{ path: string; url: string }> {
  const path = `users/${getUid()}/entries/${entryId}/${attachmentId}-${fileName}`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(storageRef);
  return { path, url };
}

export async function deleteAttachment(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
