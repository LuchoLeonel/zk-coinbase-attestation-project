
import * as circomlib from 'circomlibjs';

export const poseidonHash = async (value1: string, value2: any) => {
    if (!value1 || value2 === undefined || value2 === null) {
      throw new Error("poseidonHash recibió un value1 o value2 vacío");
    }
  
    const poseidon = await circomlib.buildPoseidon();
  
    const value1BigInt = BigInt('0x' + Buffer.from(value1).toString('hex'));
  
    let value2BigInt: bigint;
    if (typeof value2 === 'number' || typeof value2 === 'bigint') {
        value2BigInt = BigInt(value2);
    } else if (typeof value2 === 'string') {
        try {
            value2BigInt = BigInt(value2);
        } catch {
            value2BigInt = BigInt('0x' + Buffer.from(value2).toString('hex'));
        }
    } else {
        throw new Error('Tipo de value2 no soportado');
    }

    const value1Hash = poseidon([value1BigInt]);
    const value2Hash = poseidon([value2BigInt]);

    const hash = poseidon([value1Hash, value2Hash]);
    return {hash, value1Hash, value2Hash};
};

