use dep::ecrecover::{self, ecrecover};

global HARDCODED_SELECTOR: [u8; 4] = [86, 254, 237, 94];

// This is the main circuit logic for verifying a Coinbase-style ZK attestation.
// It checks that both the attester (e.g., Coinbase) and the user have signed expected messages using ECDSA.
fn main(
    attester_pub_key_x: [u8; 32],
    attester_pub_key_y: [u8; 32],
    attester_signature: [u8; 64],
    hashed_attestation_tx: pub [u8; 32],
    expected_attester: pub Field,
    user_pub_key_x: [u8; 32],
    user_pub_key_y: [u8; 32],
    user_signature: [u8; 64],
    signed_user_hash: pub [u8; 32],
    tx_calldata: [u8; 36],
) {
    // Recover the Ethereum address from the attester's public key and signature over the attestation hash.
    // This proves that the attestation was genuinely signed by the trusted attester (e.g., Coinbase).
    let attester_addr = ecrecover::ecrecover(
        attester_pub_key_x,
        attester_pub_key_y,
        attester_signature,
        hashed_attestation_tx,
    );
    // Ensure the recovered attester address matches the expected one provided publicly.
    // This prevents malicious signatures from unauthorized attesters.
    assert(attester_addr == expected_attester);

    // Recover the user's Ethereum address from their public key and signature over their identity hash.
    // This shows that the user claims ownership of a particular address (e.g., for KYC or eligibility proofs).
    let user_addr = ecrecover::ecrecover(
        user_pub_key_x,
        user_pub_key_y,
        user_signature,
        signed_user_hash,
    );

    // Extract the function selector from the calldata (first 4 bytes)
    let mut selector: Field = 0;
    for i in 0..4 {
        selector = selector * 256.into() + tx_calldata[i].into();
    }

    // Compare it to the expected function selector bytes
    for i in 0..4 {
        assert(tx_calldata[i] == HARDCODED_SELECTOR[i]);
    }

    let mut extracted_addr: Field = 0;
    for i in 0..20 {
        let byte = tx_calldata[i + 16];
        extracted_addr = extracted_addr * 256.into() + byte.into();
    }

    // Ensure the recovered user address matches the expected address.
    // This binds the user's signature to their identity in the attestation process.
    assert(user_addr == extracted_addr);
}
