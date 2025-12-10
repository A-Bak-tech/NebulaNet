import crypto from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag?: string;
  algorithm: string;
  timestamp: number;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

export class EncryptionManager {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly SALT_LENGTH = 64;
  private readonly ITERATIONS = 100000;
  
  private masterKey: Buffer;
  private keyDerivationSalt: Buffer;

  constructor() {
    // In production, load from secure storage or environment
    this.masterKey = this.generateMasterKey();
    this.keyDerivationSalt = crypto.randomBytes(this.SALT_LENGTH);
  }

  // Symmetric encryption
  async encrypt(data: string, password?: string): Promise<EncryptionResult> {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = password 
      ? await this.deriveKeyFromPassword(password)
      : this.masterKey;

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.ALGORITHM,
      timestamp: Date.now()
    };
  }

  async decrypt(encryptionResult: EncryptionResult, password?: string): Promise<string> {
    const { encrypted, iv, authTag, algorithm } = encryptionResult;
    
    if (algorithm !== this.ALGORITHM) {
      throw new Error('Unsupported encryption algorithm');
    }

    const key = password 
      ? await this.deriveKeyFromPassword(password)
      : this.masterKey;

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    if (authTag) {
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    }

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Asymmetric encryption (RSA)
  generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      publicKey,
      privateKey,
      createdAt: new Date()
    };
  }

  encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  // Hashing
  hashData(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(
      data,
      saltToUse,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
    
    return `${saltToUse}:${hash.toString('hex')}`;
  }

  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const newHash = crypto.pbkdf2Sync(
      data,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
    
    return newHash.toString('hex') === hash;
  }

  // Key derivation
  private async deriveKeyFromPassword(password: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        this.keyDerivationSalt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  private generateMasterKey(): Buffer {
    // In production, this should come from a secure source
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  // Secure random generation
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecureToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  // Data signing
  signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  }

  // Encryption for specific data types
  async encryptModelWeights(weights: number[][], password?: string): Promise<string> {
    const data = JSON.stringify(weights);
    const result = await this.encrypt(data, password);
    return JSON.stringify(result);
  }

  async decryptModelWeights(encryptedWeights: string, password?: string): Promise<number[][]> {
    const result: EncryptionResult = JSON.parse(encryptedWeights);
    const decrypted = await this.decrypt(result, password);
    return JSON.parse(decrypted);
  }

  // Secure key rotation
  async rotateMasterKey(newPassword?: string): Promise<void> {
    const oldKey = this.masterKey;
    this.masterKey = this.generateMasterKey();
    
    // Re-encrypt critical data with new key
    // This would be called with appropriate data migration logic
    console.log('Master key rotated. Old data needs re-encryption.');
  }
}