const readline = require('readline');

// Setup antarmuka untuk membaca input terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Fungsi pembantu untuk membuat input terminal menjadi rapi (async/await)
const ask = (query) => new Promise(resolve => rl.question(query, resolve));

// --- FUNGSI BANTUAN MATEMATIKA ---
function mod(n, m) { return ((n % m) + m) % m; }
function modInverse(a, m) {
    a = mod(a, m);
    for (let x = 1; x < m; x++) { if (mod((a * x), m) === 1) return x; }
    return 1;
}
function cleanText(text) { return text.toUpperCase().replace(/[^A-Z]/g, ''); }

// --- 1. VIGENERE CIPHER ---
function vigenere(text, key, isEncrypt) {
    text = cleanText(text); key = cleanText(key);
    if (!key) return "ERROR: Kunci tidak boleh kosong.";
    let result = "";
    for (let i = 0, j = 0; i < text.length; i++) {
        let p = text.charCodeAt(i) - 65;
        let k = key.charCodeAt(j % key.length) - 65;
        let c = isEncrypt ? mod(p + k, 26) : mod(p - k, 26);
        result += String.fromCharCode(c + 65);
        j++;
    }
    return result;
}

// --- 2. AFFINE CIPHER ---
function affine(text, a, b, isEncrypt) {
    text = cleanText(text);
    let result = "";
    let a_inv = modInverse(a, 26);
    if (a_inv === 1 && mod(a, 26) !== 1) return "ERROR: Nilai 'a' harus koprima dengan 26.";
    for (let i = 0; i < text.length; i++) {
        let charVal = text.charCodeAt(i) - 65;
        let val = isEncrypt ? mod((a * charVal) + b, 26) : mod(a_inv * (charVal - b), 26);
        result += String.fromCharCode(val + 65);
    }
    return result;
}

// --- 3. PLAYFAIR CIPHER ---
function generatePlayfairMatrix(key) {
    key = cleanText(key).replace(/J/g, "I");
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; 
    let matrixStr = "";
    for (let char of key + alphabet) {
        if (!matrixStr.includes(char)) matrixStr += char;
    }
    return matrixStr;
}

function playfair(text, key, isEncrypt) {
    text = cleanText(text).replace(/J/g, "I");
    let matrix = generatePlayfairMatrix(key);
    let digraphs = [];
    let i = 0;
    while (i < text.length) {
        let c1 = text[i]; let c2 = text[i + 1] || 'X';
        if (c1 === c2) { digraphs.push(c1 + 'X'); i++; } 
        else { digraphs.push(c1 + c2); i += 2; }
    }
    let result = "";
    let shift = isEncrypt ? 1 : -1;
    for (let pair of digraphs) {
        let pos1 = matrix.indexOf(pair[0]); let pos2 = matrix.indexOf(pair[1]);
        let row1 = Math.floor(pos1 / 5), col1 = pos1 % 5;
        let row2 = Math.floor(pos2 / 5), col2 = pos2 % 5;
        if (row1 === row2) {
            result += matrix[row1 * 5 + mod(col1 + shift, 5)];
            result += matrix[row2 * 5 + mod(col2 + shift, 5)];
        } else if (col1 === col2) {
            result += matrix[mod(row1 + shift, 5) * 5 + col1];
            result += matrix[mod(row2 + shift, 5) * 5 + col2];
        } else {
            result += matrix[row1 * 5 + col2];
            result += matrix[row2 * 5 + col1];
        }
    }
    return result;
}

// --- 4. HILL CIPHER (Matriks 2x2) ---
function hill2x2(text, key, isEncrypt) {
    text = cleanText(text); key = cleanText(key);
    if (key.length < 4) return "ERROR: Kunci Hill Cipher wajib minimal 4 huruf.";
    if (text.length % 2 !== 0) text += 'X';
    let k11 = key.charCodeAt(0) - 65, k12 = key.charCodeAt(1) - 65;
    let k21 = key.charCodeAt(2) - 65, k22 = key.charCodeAt(3) - 65;
    let det = mod((k11 * k22) - (k12 * k21), 26);
    let detInv = modInverse(det, 26);
    if (detInv === 1 && det !== 1) return "ERROR: Determinan matriks kunci tidak memiliki invers.";
    let result = "";
    for (let i = 0; i < text.length; i += 2) {
        let p1 = text.charCodeAt(i) - 65; let p2 = text.charCodeAt(i + 1) - 65;
        let c1, c2;
        if (isEncrypt) {
            c1 = mod((k11 * p1) + (k12 * p2), 26); c2 = mod((k21 * p1) + (k22 * p2), 26);
        } else {
            let ik11 = mod(k22 * detInv, 26); let ik12 = mod(-k12 * detInv, 26);
            let ik21 = mod(-k21 * detInv, 26); let ik22 = mod(k11 * detInv, 26);
            c1 = mod((ik11 * p1) + (ik12 * p2), 26); c2 = mod((ik21 * p1) + (ik22 * p2), 26);
        }
        result += String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
    }
    return result;
}

// --- 5. ENIGMA CIPHER (Sederhana 1-Rotor & Reflector) ---
function enigmaSimplified(text) {
    text = cleanText(text);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const rotor = "EKMFLGDQVZNTOWYHXUSPAIBRCJ";
    const reflector = "YRUHQSLDPXNGOKMIEBFZCWVJAT";
    let result = ""; let offset = 0;
    for (let i = 0; i < text.length; i++) {
        let char = text[i]; let pos = alphabet.indexOf(char);
        let posMaju = mod(pos + offset, 26); let charRotor = rotor[posMaju];
        let posRef = alphabet.indexOf(charRotor); let charReflected = reflector[posRef];
        let posRotorBack = rotor.indexOf(charReflected); let posAkhir = mod(posRotorBack - offset, 26);
        result += alphabet[posAkhir];
        offset = mod(offset + 1, 26);
    }
    return result;
}

// --- MESIN UTAMA CLI ---
async function main() {
    console.log("\n==================================");
    console.log("    CRYPTO-ENGINE 3.0 (CLI)       ");
    console.log("==================================");
    console.log("1. Vigenere Cipher");
    console.log("2. Affine Cipher");
    console.log("3. Playfair Cipher");
    console.log("4. Hill Cipher (Matriks 2x2)");
    console.log("5. Enigma Cipher (1-Rotor)");
    console.log("==================================");

    let cipherChoice = await ask("Pilih Algoritma (1-5): ");
    let actionChoice = await ask("Pilih Aksi (1 = Enkripsi, 2 = Dekripsi): ");
    let text = await ask("Masukkan Pesan Teks: ");
    
    let isEncrypt = (actionChoice === '1');
    let result = "";

    switch (cipherChoice) {
        case '1':
            let vigKey = await ask("Masukkan Kunci (Teks): ");
            result = vigenere(text, vigKey, isEncrypt);
            break;
        case '2':
            let a = parseInt(await ask("Masukkan nilai 'a' (Koprima dgn 26, ex: 5): ")) || 5;
            let b = parseInt(await ask("Masukkan nilai 'b' (ex: 8): ")) || 8;
            result = affine(text, a, b, isEncrypt);
            break;
        case '3':
            let playKey = await ask("Masukkan Kunci (Teks): ");
            result = playfair(text, playKey, isEncrypt);
            break;
        case '4':
            let hillKey = await ask("Masukkan Kunci (WAJIB 4 Huruf, ex: DDCF): ");
            result = hill2x2(text, hillKey, isEncrypt);
            break;
        case '5':
            console.log("[Info] Enigma berjalan otomatis secara simetris.");
            result = enigmaSimplified(text);
            break;
        default:
            console.log("Pilihan algoritma tidak valid.");
            rl.close();
            return;
    }

    console.log("\n----------------------------------");
    console.log(` HASIL ${isEncrypt ? 'ENKRIPSI' : 'DEKRIPSI'}:`);
    console.log(` > ${result}`);
    console.log("----------------------------------\n");
    
    rl.close();
}

// Jalankan aplikasi
main();