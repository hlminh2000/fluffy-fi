import { Storage } from "@plasmohq/storage"
import PromiseQueue from "promise-queue";
import Queue from 'promise-queue';
import { STORAGE_KEY } from "~common/utils/constants";
import { passwordHashManager } from "./passwordHashManager";
import { passwordCache } from "./passwordCache";

export const storageVault = (() => {
  enum EncryptionAlgo {
    "AES-CBC" = "AES-CBC"
  }
  type VaultEncryptedObject = { cipher: string, algo: EncryptionAlgo, vaultManaged: true }
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
  const encrypt = async <T>(value: T, keyPlaintext: string, algo: EncryptionAlgo): Promise<VaultEncryptedObject> => {
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
      ]),
      algo,
      vaultManaged: true
    }
  }
  const decrypt = async <T>({ cipher, algo }: VaultEncryptedObject, keyPlaintext: string): Promise<T> => {
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

  const isVaultEncryptedObject = (data: any): data is VaultEncryptedObject => data?.algo in EncryptionAlgo && data?.vaultManaged
  const isUnlocked = () => passwordCache.isPasswordSet()

  const set = async <T>(storageKey: string, value: T) => {
    if (!isUnlocked()) throw new Error("No PIN cache available")
    const algo = EncryptionAlgo["AES-CBC"]
    const password = await passwordCache.getPassword()
    if (!password) throw new Error()
    const encryptedObject = {
      ...(await encrypt(value, password, algo)),
      vaultManaged: true
    }
    await storage.set(storageKey, encryptedObject)
  }

  const reEncrypt = async (oldPassword: string, newPassword: string) => {
    if (!isUnlocked()) throw new Error("No PIN cache available")
    if (!passwordHashManager.isPasswordValid(oldPassword)) throw new Error("Old PIN is incorrect")
    globalLock = true;
    const algo = EncryptionAlgo["AES-CBC"]
    const allData = await storage.getAll()
    await Promise.all(Object.entries(allData).map(async ([key, value]) => {
      try {
        const parsed = JSON.parse(value);
        if (!isVaultEncryptedObject(parsed)) throw new Error();
        const decrypted = await decrypt(parsed, oldPassword)
        await storage.set(`${key}::migration_temp`, decrypted)
        const newCipher = await encrypt(decrypted, newPassword, algo)
        await storage.set(key, newCipher)
        return { success: true }
      } catch (err) {
        console.warn(`${key} is not a vault managed object`)
        return { success: false }
      }
    }))
    await passwordHashManager.hashPassword({ password: newPassword })
    await passwordCache.setPassword(newPassword)
    await storage.set(STORAGE_KEY.lastLoginTime, Date.now())
    const migrationStorageKeys = Object.keys((await storage.getAll()))
      .filter(key => key.split("::")[1] === "migration_temp")
    for (const key of migrationStorageKeys) {
      await storage.remove(key)
    }
    globalLock = false;
  }

  const get = async <T>(storageKey: string): Promise<T> => {
    if (!isUnlocked()) throw new Error("No PIN cache available")
    const password = await passwordCache.getPassword()
    if (!password) throw new Error()
    const storedData = await storage.get(storageKey) as any
    if (isVaultEncryptedObject(storedData)) {
      const value = await decrypt<T>(storedData, password)
      return value
    } else {
      return storedData as T
    }
  }
  const remove = async (storageKey: string) => {
    if (!isUnlocked()) throw new Error("No PIN cache available")
    await storage.remove(storageKey);
  }
  const forceRemove = async (storageKey: string) => {
    await storage.remove(storageKey);
  }

  /**
   * queued versions of some private methods, subject to global lock
   */
  let globalLock = false;
  const queuedSet = (async <T>(storageKey: string, value: T) => {
    if (globalLock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return queuedSet(storageKey, value)
    }
    if (!queues[storageKey]) queues[storageKey] = new Queue(1)
    return queues[storageKey].add(() => set(storageKey, value))
  }) as typeof set
  const queuedGet = (async <T>(storageKey: string) => {
    if (globalLock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return queuedGet(storageKey)
    }
    if (!queues[storageKey]) queues[storageKey] = new Queue(1)
    return queues[storageKey].add(() => get<T>(storageKey))
  }) as typeof get
  const queuedRemove = (async (storageKey: string) => {
    if (globalLock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return queuedRemove(storageKey)
    }
    if (!queues[storageKey]) queues[storageKey] = new Queue(1)
    return queues[storageKey].add(() => remove(storageKey))
  }) as typeof remove
  const queuedForceRemove = (async (storageKey: string) => {
    if (globalLock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return queuedForceRemove(storageKey)
    }
    if (!queues[storageKey]) queues[storageKey] = new Queue(1)
    return queues[storageKey].add(() => forceRemove(storageKey))
  }) as typeof forceRemove

  return {
    get: queuedGet,
    set: queuedSet,
    remove: queuedRemove,
    forceRemove: queuedForceRemove,
    isUnlocked,
    reEncrypt
  }
})()
