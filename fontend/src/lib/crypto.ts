import CryptoJS from "crypto-js"

const SECRET_KEY = "crypto-secret"

export function encryptPhone(phoneNumber: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(phoneNumber, SECRET_KEY).toString()
    return encodeURIComponent(encrypted)
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt phone number")
  }
}

export function decryptPhone(encryptedPhone: string): string {
  try {
    const decoded = decodeURIComponent(encryptedPhone)
    const bytes = CryptoJS.AES.decrypt(decoded, SECRET_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    if (!decrypted) {
      throw new Error("Failed to decrypt")
    }

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt phone number")
  }
}
