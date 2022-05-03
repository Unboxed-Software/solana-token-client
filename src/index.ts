import dotenv from "dotenv";
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  mintTo,
  setAuthority,
  AuthorityType,
  createAccount,
  createAssociatedTokenAccount,
  transfer,
  burn,
  closeAccount,
  approve,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

dotenv.config();

async function main() {
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const owner = Keypair.fromSecretKey(secretKey);

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // const totalSupply = 1000000000;
  const mintAmount = 1000;
  const transferAmount = 500;
  // const tokenData = await createNewToken(connection, owner, totalSupply);

  const mintAuthority = Keypair.generate();

  // returns "PublicKey"
  const mint = await createMint(
    connection, // connection
    owner, // payer
    mintAuthority.publicKey, // mint authority
    null, // freeze authority
    2 // decimals
  );

  console.log(mint.toString());

  const tokenKeyPair = Keypair.generate();

  console.log(tokenKeyPair.publicKey.toString());

  //returns "PublicKey"
  const tokenAccount = await createAccount(
    connection, // connection
    owner, // payer
    mint, // token mint
    owner.publicKey, // owner
    tokenKeyPair // token address
  );

  console.log(tokenAccount.toString());

  //returns "PublicKey"
  const associatedTokenAccount = await createAssociatedTokenAccount(
    connection, //connection
    owner, // payer
    mint, // token mint
    owner.publicKey // owner
  );

  console.log(associatedTokenAccount.toString());

  // returns "Account"
  const getOrCreate = await getOrCreateAssociatedTokenAccount(
    connection, // connection
    owner, // payer
    mint, // token mint
    owner.publicKey // owner
  );

  console.log(getOrCreate.address.toString());

  // mint to Token Account
  // returns "TransactionSigniture"
  const mintTokens = await mintTo(
    connection, // connection
    owner, // payer
    mint, // mint
    associatedTokenAccount, // token account mint to
    mintAuthority, // mint authority
    mintAmount // amount tokens to mint
  );

  console.log(mintTokens);

  // check Account.amount = mintAmount
  const Account = await getAccount(connection, associatedTokenAccount);
  console.log(Number(Account.amount));

  const receiver = Keypair.generate();
  const receiverAssociatedTokenAccount = await createAssociatedTokenAccount(
    connection,
    owner,
    mint,
    receiver.publicKey
  );

  // transfer Tokens
  // returns "TransactionSigniture"
  const tokenTransfer = await transfer(
    connection, // connection
    owner, // payer
    associatedTokenAccount, // Token Account send Tokens
    receiverAssociatedTokenAccount, // Token Account receive Tokens
    owner, // owner of Token Account to send from
    transferAmount // amount of Tokens to send
  );

  console.log(tokenTransfer);

  // burn Tokens
  // returns "TransactionSigniture"
  const burnToken = await burn(
    connection, // connection
    owner, // payer
    associatedTokenAccount, // Token Account burn from
    mint, // Token Mint
    owner, // Token Account owner
    100 // Amount to burn
  );

  console.log(burnToken);

  // // close Token Account
  // // returns "TransactionSigniture"
  // const closeTokenAccount = await closeAccount(
  //   connection, // connection
  //   owner, // payer
  //   tokenAccount, // token account to close
  //   owner.publicKey, // account to return token account rent to
  //   owner // token account owner
  // );

  // console.log(closeTokenAccount);

  // new keypair to represent delegate
  const delegate = Keypair.generate();

  // delegate tokens for transfer
  // returns "TransactionSignature"
  const delegateTokens = await approve(
    connection, // connection to Solana
    owner, // payer
    associatedTokenAccount, // Token Account to delegate from
    delegate.publicKey, // delegate address
    owner, // Token Account owner
    100 // amount approved for delegate to transfer
  );

  console.log(delegateTokens);

  console.log("test");

  // new keypair to represent new owner
  const newOwner = Keypair.generate();

  // set new Authority for Token Account
  // returns "TransactionSignature"
  const newTokenAccountOwner = await setAuthority(
    connection, // connection to Solana
    owner, // payer
    tokenAccount, // Token Account to set new owner
    owner, // current owner of Token Account
    AuthorityType.AccountOwner, // Authority Type (MintToken: 0)
    newOwner.publicKey // new owner of Token Account
  );

  console.log(newTokenAccountOwner);

  // console.log(
  //   `Our new token is ${tokenData.tokenAddress.toBase58()} and all of the supply (${totalSupply}) resides in token account ${tokenData.tokenAddress.toBase58()}`
  // );
}

main().then(() => {
  process.exit();
});

class TokenData {
  tokenAddress: PublicKey;
  tokenAccount: PublicKey;

  constructor(tokenAddress: PublicKey, tokenAccount: PublicKey) {
    this.tokenAddress = tokenAddress;
    this.tokenAccount = tokenAccount;
  }
}

async function createNewToken(
  connection: Connection,
  signer: Keypair,
  totalSupply: number
): Promise<TokenData> {
  const mintAuthority = Keypair.generate();

  const mint = await createMint(
    connection,
    signer,
    mintAuthority.publicKey,
    null,
    9 // We are using 9 to match the CLI decimal default exactly
  );

  console.log("Our token address is:", mint.toBase58());

  const mintInfo = await getMint(connection, mint);

  console.log("The initial supply of tokens is:", mintInfo.supply);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    signer,
    mint,
    signer.publicKey
  );

  console.log(
    "Our new associated token account is:",
    tokenAccount.address.toBase58()
  );
  console.log(
    `Our new associated token account has ${tokenAccount.amount} tokens`
  );

  await mintTo(
    connection,
    signer,
    mint,
    tokenAccount.address,
    mintAuthority,
    totalSupply
  );

  const updatedTokenAccountInfo = await getAccount(
    connection,
    tokenAccount.address
  );
  const updatedMintInfo = await getMint(connection, mint);

  console.log(
    `The associated account ${tokenAccount.address.toBase58()} now has ${
      updatedTokenAccountInfo.amount
    } tokens`
  );
  console.log(
    `The total supply of ${mintInfo.address.toBase58()} is now ${
      updatedMintInfo.supply
    }`
  );

  setAuthority(
    connection,
    signer,
    mint,
    mintAuthority,
    AuthorityType.MintTokens,
    null
  );

  return new TokenData(mint, tokenAccount.address);
}
