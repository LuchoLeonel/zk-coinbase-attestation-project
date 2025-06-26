export function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error("Hex string must have even length");
    if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error("Invalid hex string");

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Convert a byte array to a hex string
export function bytesToHex(bytes: Uint8Array) {
    let hex = [];
    for (let i = 0; i < bytes.length; i++) {
        let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}