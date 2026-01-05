import type { FirebaseApp } from 'firebase/app';

export const getFirebaseStorageModule = (() => {
  let promise: Promise<typeof import('firebase/storage')> | null = null;
  return () => (promise ??= import('firebase/storage'));
})();

export async function getStorageForApp(app: FirebaseApp) {
  const mod = await getFirebaseStorageModule();
  return mod.getStorage(app);
}
