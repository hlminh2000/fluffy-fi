import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEY } from "./constants"
import { Storage } from "@plasmohq/storage"

export const usePasswordHash = () => {
  type SupportedAlgo = "SHA-256"
  
  const [storedHash, setPasswordHash] = useStorage<{
    hash: null | number[],
    algo: SupportedAlgo
  }>({
    key: STORAGE_KEY.passwordHash,
    instance: new Storage()
  })

  const computeHash = async (value: string, algo: SupportedAlgo = "SHA-256") => Array.from(
    new Uint8Array(await crypto.subtle.digest(algo, new TextEncoder().encode(value)))
  )

  const hashPassword = async ({
    algo = "SHA-256",
    password
  }: {
    algo?: typeof storedHash["algo"],
    password: string
  }) => {
    const hash = await computeHash(password, algo)
    await setPasswordHash({ hash, algo })
  }

  const isPasswordValid = async (password: string) => {
    const { hash, algo } = storedHash;
    const passwordHash = await computeHash(password, algo)
    const sameAtIndex = i => hash[i] === passwordHash[i]
    return hash.every((n, i) => sameAtIndex(i)) && passwordHash.every((n, i) => sameAtIndex(i))
  }

  return {
    passwordHash: storedHash,
    hashPassword,
    isPasswordValid,
    isPasswordSet: !!storedHash?.hash
  }
}
