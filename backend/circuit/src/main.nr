use eddsa::eddsa_verify;
use std::hash::poseidon;
use dep::ecrecover;

fn main(
  // ECDSA (attester)
  pub_key_x: [u8; 32],
  pub_key_y: [u8; 32],
  signature_ecdsa: [u8; 64],
  hashed_attestation_tx: pub [u8; 32],
  expected_attester: pub Field,
  // EdDSA (property of userAddress)
  signature_R8x: Field,
  signature_R8y: Field,
  signature_S: Field,
  user_pubkey_x: Field,
  user_pubkey_y: Field,
  signed_user_address_hash: pub Field
)