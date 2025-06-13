use std::hash::poseidon;
use eddsa::eddsa_verify;

fn main(
    attested_address: Field,
    contract_address: pub Field,
    function_selector: pub Field,
    hash: pub Field,
    signature_R8x: pub Field,
    signature_R8y: pub Field,
    signature_S: pub Field,
    signer_x: pub Field,
    signer_y: pub Field,
) {
    let local_hash = poseidon::bn254::hash_3([
        attested_address,
        contract_address,
        function_selector
    ]);

    assert(local_hash == hash);

    let is_valid = eddsa_verify::<poseidon::PoseidonHasher>(
        signer_x,
        signer_y,
        signature_S,
        signature_R8x,
        signature_R8y,
        hash
    );

    assert(is_valid);
}
