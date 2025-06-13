import { Injectable, Logger } from '@nestjs/common';
import zkEmailSdk from '@zk-email/sdk';
import { GenerateProofDto } from './dto/generate-proofs.dto';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/noir_js';
import { readFileSync } from 'fs';
import { join } from 'path';


const BLUEPRINT = "LuchoLeonel/ZkAccess@v8";


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
      values: s.values.map((v) => BigInt(v).toString()),
      keys: s.keys.map((v) => BigInt(v).toString()),
      hashes: s.hashes.map((v) => BigInt(v).toString()),
      compared_values: s.compared_values.map((v) => BigInt(v).toString()),
      operations: s.operations.map((v) => BigInt(v).toString()),
      signature_R8xs: s.signature_R8xs.map((v) => BigInt(v).toString()),
      signature_R8ys: s.signature_R8ys.map((v) => BigInt(v).toString()),
      signature_Ss: s.signature_Ss.map((v) => BigInt(v).toString()),
      signer_x: BigInt(s.signer_x).toString(),
      signer_y: BigInt(s.signer_y).toString(),
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
