const crypto = require('crypto');
const fs = require('fs');
const { Transform } = require('stream');

// A simple transform stream that appends the IV to the file so that it can be used when encrypting the file
// When dealing with data not being written to files, this can be done with a Buffer.concat call instead, which might be simpler for your use case
class AppendIv extends Transform {
    constructor(iv) {
        super();
        this.appended = false;
        this.iv = iv;
    }

    _transform(chunk, encoding, cb) {
        if (!this.appended) {
            this.push(this.iv);
            this.appended = true;
        }
        this.push(chunk);
        
        cb();
    }
}

// This piece of data should be secured and hidden in the .env file and never actually tracked with the project
const sharedPassphrase = 'testing with a passphrase (shouldn\'t normally be tracked in project)';

// In reality, these should be generated and then saved somewhere so that they aren't lost; these are just being generated on-the-fly solely for this proof-of-concept
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        format: 'pem',
        type: 'spki',
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: sharedPassphrase,
    },
});

// Create first reading the original file to encrypt and then writing the encrypted result (encrypted file cannot be read/opened by photo software)
const readStream = fs.createReadStream('./clone-wars-last-man-standing-in-destiny.gif');
const encryptedWriteStream = fs.createWriteStream('encrypted.gif');

// Let us know if there was an error
readStream.on('error', err => {
    console.warn(err);
});

// When it completes, the result is as if it was saved in the system
encryptedWriteStream.on('close', async () => {
    // When using aes-256-gcm algorithm, it generates an auth tag required to authenticate the decipher algorithm in order for it to tell if the decrypted data should be trusted
    // Previously, while using aes-256-cbc, the auth tag was not generated or needed, but otherwise took the exact same steps
    // The auth tag could be appended or prepended to the encrypted data and it can be public (as far as I can tell)
    // The only thing that it looks like you can't do is get the auth tag and append it to the file before it's written--there will have to be anothe way to transport it
    // Potentially, this might require making a temp file with only the IV appended (or not, since I like having the IV first) and then when it writes to the final
    // location, it reads the temp file and then adds the IV and tag to the file
    const authTag = cipher.getAuthTag();
    // This emulates encrypting the key used for encrypting the file so that it can be sent to the intended party
    const rsaEncrypted = crypto.privateEncrypt({ key: privateKey, passphrase: sharedPassphrase }, tempKey);
    
    // This is where we actually "send" the file and start pulling the iv from it
    let iv;
    for await (const ivBytes of fs.createReadStream('encrypted.gif', { end: 15 })) {
        iv = ivBytes;
    }

    // When we have the IV from the file, we can go ahead and decrypt the key and then the actual file
    const decryptedKey = crypto.publicDecrypt({ key: publicKey, passphrase: sharedPassphrase }, rsaEncrypted);

    const decipher = crypto.createDecipheriv('aes-256-gcm', decryptedKey, iv);
    // ensure GCM gets the auth tag it needs to verify the data hasn't been tampered with
    decipher.setAuthTag(authTag);
    
    
    // Start reading the encrypted file
    const encryptedReadStream = fs.createReadStream('encrypted.gif', { start: 16 });
    const resultWriteStream = fs.createWriteStream('result.gif');
    
    // Do something when the result file has been written
    encryptedReadStream.on('close', () => {
        console.log('Result file written successfully');
    });
    
    // Handle it if it fails
    encryptedReadStream.on('error', (err) => {
        if (err) console.error(err);
    });

    // Let the decryption begin!
    encryptedReadStream
        .pipe(decipher)
        .pipe(resultWriteStream);
});

// randomly create the IV, key, and cipher for this demo
// In a real application, the key would likely not be generated each time before saving the file
const tempKeyIv = crypto.randomBytes(16);
const tempKey = crypto.randomBytes(32);
const cipher = crypto.createCipheriv('aes-256-gcm', tempKey, tempKeyIv);

readStream
    .pipe(cipher)
    .pipe(new AppendIv(tempKeyIv))
    .pipe(encryptedWriteStream);
