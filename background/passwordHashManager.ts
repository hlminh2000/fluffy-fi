import { Storage } from "@plasmohq/storage"
import PromiseQueue from "promise-queue";
import { STORAGE_KEY } from "~common/utils/constants";

export const passwordHashManager = (() => {
  type SupportedAlgo = "SHA-256"
  type StorageHashStorage = {
    hash: null | number[],
    algo: SupportedAlgo
  }
  const storage = new Storage();
  const computeHash = async (value: string, algo: SupportedAlgo = "SHA-256") => Array.from(
    new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(value)))
  )
  const accessQueue = new PromiseQueue(1);
  const hashPassword = async ({
    password
  }: {
    password: string
  }) => accessQueue.add(async () => {
    const algo:SupportedAlgo = "SHA-256"
    const hash = await computeHash(password, algo)
    await storage.set(STORAGE_KEY.passwordHash, { hash, algo });
  })
  const getPasswordHash = () => accessQueue.add(
    async () =>{
      return await storage.get(STORAGE_KEY.passwordHash) as StorageHashStorage | undefined
    }
  )
  const isPasswordValid = async (password: string) => {
    try {
      const { hash, algo } = (await getPasswordHash()) as StorageHashStorage;
      const passwordHash = await computeHash(password, algo)
      const sameAtIndex = i => hash?.[i] === passwordHash[i]
      return hash?.every((n, i) => sameAtIndex(i)) && passwordHash.every((n, i) => sameAtIndex(i)) || false
    } catch (err) {
      return false
    }
  }
  return {
    getPasswordHash,
    hashPassword,
    isPasswordValid
  }
})();
