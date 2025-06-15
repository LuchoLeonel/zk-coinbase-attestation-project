use dep::ecrecover::{self, ecrecover};

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
    expected_user_address: pub Field,
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
    // Ensure the recovered user address matches the expected address.
    // This binds the user's signature to their identity in the attestation process.
    assert(user_addr == expected_user_address);
}
