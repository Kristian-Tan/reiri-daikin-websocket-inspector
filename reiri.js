// apt install nodejs
// npm install node-rsa
// npm install crypto
// npm install browserify-cipher
// npm install fs

// usage: node reiri.js /path/to/private-key.pem /path/to/common_key encrypt/decrypt/generate plaintext/ciphertext/keylength
// example: node reiri.js /path/to/private-key.pem /path/to/common_key encrypt '{"name":"user","passwd":"pass"}'
// example: node reiri.js /path/to/private-key.pem /path/to/common_key decrypt 4d73a4a1297794ef2d9c982cfc36812e50d4647d1e8996d95761e488e832d7ee16b5f6a0f2fcdd42857470b9f39645b356101f41407538f3c36269141c83367df817979f9556f7c37fc319b6529bfb0f9087f447ef1109b52750df61e7b1bce8d9d7b8ce7d11d1b7fbcb3ca0454369b48b9643d213228e633f6f468d2e13eb86410109c90a9e17f11fa7019cba6f4be753ccda7ca5eb1ca8e901edfcfa99751c153f868f05cfa37aac34959c7ecb42dfca6ae97638d2c2f8ab0f27529b149209242564fb72c21a152d6fe1bde474377e8d2507eefcd66ebedc435bee8b7c9e249d92e496c242a73777dd6bf443a75c4e3f62382b3b47afbd86cbf85629d9758f5129fa2808c0174fe17c208f12b90ded42cd6d1d28fd95054b5a91a99e8aab4ebd1a00e3f088e7ceeb7736ea3e72cc0701ccdc4ff96c9db49b366d008694528ed531b3698445f19b558ae1d39669bc30a3c73baceecbdfd75cb47168268488ede5dae38cf688a57214c47a7ed618b847
// example: node reiri.js /path/to/private-key.pem /path/to/public-key.pem generate 2048


// how to get private-key.pem :
// chrome devtools > console
// console.log(window.localStorage.getItem('private_key'));
// console.log(window.localStorage.getItem('public_key'));

// how to get common_key :
// chrome devtools > network > WS > see first 2 message "sys_info"
// replace \n to newline:
// awk -i '{gsub(/\\n/,"\n")}1' /path/to/file

const NodeRSA = require('node-rsa'); // https://github.com/rzcoder/node-rsa https://www.npmjs.com/package/node-rsa
const Crypto = require('crypto'); // https://nodejs.org/api/crypto.html
const fs = require('fs');

const args = process.argv.slice(2);
const argFilePrivateKey = args[0];
const argFileCommonKey = args[1];
const argMode = args[2];
var argContent = args[3];

if(!(argFilePrivateKey)) { console.log("incomplete argument"); process.exit(1); }
if(!(argFileCommonKey)) { console.log("incomplete argument"); process.exit(1); }
if(!(argMode)) { console.log("incomplete argument"); process.exit(1); }
if(!(argContent)) { console.log("incomplete argument"); process.exit(1); }

if(argContent == "STDIN") {
    const stdinBuffer = fs.readFileSync(process.stdin.fd);
    argContent = stdinBuffer.toString().trim();
    // console.log(argContent); return;
}


if(argMode == "generate") {
    const rsa = new NodeRSA({b: parseInt(argContent)});
    const privateKeyStr = rsa.exportKey("pkcs1-private-pem");
    const publicKeyStr = rsa.exportKey("pkcs1-public-pem");
    fs.writeFileSync(argFilePrivateKey, privateKeyStr+"\n");
    fs.writeFileSync(argFileCommonKey, publicKeyStr+"\n");
} else if(argMode == "encrypt" || argMode == "decrypt") {
    const rsa = new NodeRSA(fs.readFileSync(argFilePrivateKey,'utf8'));
    const enc = fs.readFileSync(argFileCommonKey,'utf8');

    const common_key = rsa.decrypt(enc); // data type must be UInt8Array!!

    //console.log(common_key);

    decrypt = (data,common_key) => {
        let decipher = Crypto.createDecipheriv('aes-128-cbc', common_key, common_key);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    // For encrypting outgoing requests when in local network
    encrypt = (data,common_key) => {
        let cipher = Crypto.createCipheriv('aes-128-cbc', common_key, common_key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    if(argMode == "encrypt") {
        console.log(encrypt(argContent,common_key));
    } else if(argMode == "decrypt") {
        console.log(decrypt(argContent,common_key));
    }
} else {
    console.log("unknown operation");
    process.exit(1);
}


