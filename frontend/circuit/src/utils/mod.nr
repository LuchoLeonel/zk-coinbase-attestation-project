pub fn concat_nonce_and_timestamp(a: [u8; 32], b: [u8; 32]) -> [u8; 64] {
    let mut out: [u8; 64] = [0; 64];
    for i in 0..32 {
        out[i] = a[i];
        out[32 + i] = b[i];
    }
    out
}

pub fn concat_prefix_and_digest(prefix: [u8; 28], digest: [u8; 32]) -> [u8; 60] {
    let mut out: [u8; 60] = [0; 60];
    for i in 0..28 {
        out[i] = prefix[i];
    }
    for i in 0..32 {
        out[28 + i] = digest[i];
    }
    out
}


pub fn extract_address_from_calldata(calldata: [u8; 36]) -> Field {
    let mut addr: Field = 0;
    for i in 0..20 {
        let byte = calldata[i + 16];
        addr = addr * 256.into() + byte.into();
    }
    addr
}
