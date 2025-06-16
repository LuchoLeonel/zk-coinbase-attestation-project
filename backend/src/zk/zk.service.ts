import { Injectable, Logger } from '@nestjs/common';
import zkEmailSdk from '@zk-email/sdk';
import { GenerateProofDto } from './dto/generate-proofs.dto';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/noir_js';
import { readFileSync } from 'fs';
import { join } from 'path';


@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkService.name);

  async generateProof(s: GenerateProofDto) {
    const rawCircuitPath = join(process.cwd(), 'public', 'zk_coinbase_attestation.json');
    const rawCircuit = JSON.parse(readFileSync(rawCircuitPath, 'utf8'));

    const circuit = rawCircuit as CompiledCircuit;
    const noir = new Noir(circuit);
    const backend = new UltraHonkBackend(circuit.bytecode);
  
    const inputs = {
      attester_pub_key_x: s.attester_pub_key_x.map((v) => BigInt(v).toString()),
      attester_pub_key_y: s.attester_pub_key_y.map((v) => BigInt(v).toString()),
      attester_signature: s.attester_signature.map((v) => BigInt(v).toString()),
      hashed_attestation_tx: s.hashed_attestation_tx.map((v) => BigInt(v).toString()),
      expected_attester: BigInt(s.expected_attester).toString(),
      user_pub_key_x: s.user_pub_key_x.map((v) => BigInt(v).toString()),
      user_pub_key_y: s.user_pub_key_y.map((v) => BigInt(v).toString()),
      user_signature: s.user_signature.map((v) => BigInt(v).toString()),
      nonce_hash: s.nonce_hash.map((v) => BigInt(v).toString()),
      timestamp_hash: s.timestamp_hash.map((v) => BigInt(v).toString()),
      tx_calldata: s.calldata.map((v) => BigInt(v).toString()),
    };

    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness, { keccak: true });
    console.log("Proof length (bytes):", proof.proof.length);
    console.log("Public inputs length (bytes):", proof.publicInputs.length * 32);
    return { proof };
  }
  
  async verifyProof({ proof, publicInputs }: any) {
    const rawCircuitPath = join(process.cwd(), 'public', 'zk_coinbase_attestation.json');
    const rawCircuit = JSON.parse(readFileSync(rawCircuitPath, 'utf8'));
    const circuit = rawCircuit as CompiledCircuit;
    const backend = new UltraHonkBackend(circuit.bytecode);

    const reconstructedProof = this.objectToUint8Array(proof);
    const isValid = await backend.verifyProof({ proof: reconstructedProof, publicInputs }, { keccak: true });
    return { isValid };
  }

  objectToUint8Array(proofObj: Record<string, number>): Uint8Array {
    const sorted = Object.entries(proofObj)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, val]) => val);
    return new Uint8Array(sorted);
  }
}
