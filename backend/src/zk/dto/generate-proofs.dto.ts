import { IsArray, IsNumber, IsString } from 'class-validator';

export class GenerateProofDto {
  @IsArray()
  @IsNumber({}, { each: true })
  attester_pub_key_x: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  attester_pub_key_y: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  attester_signature: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  hashed_attestation_tx: number[];

  @IsString()
  expected_attester: string;

  @IsArray()
  @IsNumber({}, { each: true })
  user_pub_key_x: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  user_pub_key_y: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  user_signature: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  nonce_hash: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  timestamp_hash: number[];

  @IsString()
  calldata: number[];
}
