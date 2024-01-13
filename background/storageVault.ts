import { Storage } from "@plasmohq/storage"
import Queue from 'promise-queue';
import { passwordCache } from "~background";

export const storageVault = (() => {
  enum EncryptionAlgo {
    "AES-CBC" = "AES-CBC"
  }
  type EncryptedObject = { cipher: string, algo: EncryptionAlgo }
  const storage = new Storage()
  const queues: { [k: string]: Queue } = {}

  const PBKDF2 = async (password: string, salt: Uint8Array, algo = EncryptionAlgo["AES-CBC"]) => {
    const iterations: number = 100000
    const length: number = 256
    const hash = "SHA-256"
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations,
        hash
      },
      keyMaterial,
      { name: algo, length },
      false, // we don't need to export our key!!!
      ['encrypt', 'decrypt']
    );
  }

  const salt_len = 16;
  const iv_len = 16;
  const encrypt = async <T>(value: T, keyPlaintext: string, algo: EncryptionAlgo): Promise<EncryptedObject> => {
    const encoder = new TextEncoder();

    const toBase64 = buffer =>
      btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const salt = crypto.getRandomValues(new Uint8Array(salt_len));
    const iv = crypto.getRandomValues(new Uint8Array(iv_len));
    const plain_text = encoder.encode(JSON.stringify(value));
    const key = await PBKDF2(keyPlaintext, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: algo, iv },
      key,
      plain_text
    );
    return {
      cipher: toBase64([
        ...salt,
        ...iv,
        ...new Uint8Array(encrypted)
      ])
      , algo
    }
  }
  const decrypt = async <T>({ cipher, algo }: EncryptedObject, keyPlaintext: string): Promise<T> => {
    const decoder = new TextDecoder();

    const fromBase64 = buffer =>
      Uint8Array.from(atob(buffer), c => c.charCodeAt(0));

    const encrypted = fromBase64(cipher);

    const salt = encrypted.slice(0, salt_len);
    const iv = encrypted.slice(0 + salt_len, salt_len + iv_len);
    const key = await PBKDF2(keyPlaintext, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: algo, iv },
      key,
      encrypted.slice(salt_len + iv_len)
    );
    return JSON.parse(decoder.decode(decrypted))
  }

  const isEncryptedObject = (data: any): data is EncryptedObject => data?.algo in EncryptionAlgo
  const isUnlocked = () => passwordCache.isPasswordSet()

  const set = async <T>(storageKey: string, value: T) => {
    if (!isUnlocked()) throw new Error("No password cache available")
    const algo = EncryptionAlgo["AES-CBC"]
    const cipher = await encrypt(value, await passwordCache.getPassword(), algo)
    await storage.set(storageKey, cipher)
  }
  const get = async <T>(storageKey: string): Promise<T> => {
    if (!isUnlocked()) throw new Error("No password cache available")
    const storedData = await storage.get(storageKey) as any
    if (isEncryptedObject(storedData)) {
      const value = await decrypt<T>(storedData, await passwordCache.getPassword())
      return value
    } else {
      return storedData as T
    }
  }
  const remove = async (storageKey: string) => {
    if (!isUnlocked()) throw new Error("No password cache available")
    await storage.remove(storageKey);
  }

  return {
    set: (<T>(storageKey: string, value: T) => {
      if (!queues[storageKey]) queues[storageKey] = new Queue(1)
      return queues[storageKey].add(() => set(storageKey, value))
    }) as typeof set,
    get: (<T>(storageKey: string) => {
      if (!queues[storageKey]) queues[storageKey] = new Queue(1)
      return queues[storageKey].add(() => get<T>(storageKey))
    }) as typeof get,
    remove: ((storageKey: string) => {
      if (!queues[storageKey]) queues[storageKey] = new Queue(1)
      return queues[storageKey].add(() => remove(storageKey))
    }) as typeof remove,
    isUnlocked
  }
})()
