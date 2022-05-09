import web3 = require("@solana/web3.js");
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  burn,
  closeAccount,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import Dotenv from "dotenv";
Dotenv.config();

async function main() {
  const user = initializeKeypair();
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  await connection.requestAirdrop(user.publicKey, web3.LAMPORTS_PER_SOL * 2);

  //TEST MINT
  const transaction = new web3.Transaction();
  const newMint = web3.Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  transaction.add(
    web3.SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: newMint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      newMint.publicKey,
      2,
      user.publicKey,
      user.publicKey,
      TOKEN_PROGRAM_ID
    )
  );

  const sig = await web3.sendAndConfirmTransaction(connection, transaction, [
    user,
    newMint,
  ]);

  console.log(sig);
  //TEST END

  const mint = await createNewMint(
    connection,
    user,
    user.publicKey,
    user.publicKey,
    2
  );

  const tokenAccount = await createTokenAccount(
    connection,
    user,
    mint,
    user.publicKey
  );

  await mintTokens(connection, user, mint, tokenAccount.address, user, 100);

  const receiver = web3.Keypair.generate();
  await connection.requestAirdrop(
    receiver.publicKey,
    web3.LAMPORTS_PER_SOL * 1
  );

  const receiverTokenAccount = await createTokenAccount(
    connection,
    user,
    mint,
    receiver.publicKey
  );

  await transferTokens(
    connection,
    user,
    tokenAccount.address,
    receiverTokenAccount.address,
    user,
    100
  );

  await burnTokens(
    connection,
    receiver,
    receiverTokenAccount.address,
    mint,
    receiver,
    100
  );

  await closeTokenAccount(
    connection,
    receiver,
    receiverTokenAccount.address,
    receiver.publicKey,
    receiver
  );
}

function initializeKeypair(): web3.Keypair {
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey);
  return keypairFromSecretKey;
}

async function createNewMint(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  freezeAuthority: web3.PublicKey,
  decimal: number
) {
  const mint = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimal
  );

  console.log(
    `Token Mint: https://explorer.solana.com/address/${mint}?cluster=devnet`
  );

  return mint;
}

async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  );

  console.log(
    `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  );

  return tokenAccount;
}

async function mintTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair,
  amount: number
) {
  const transactionSignature = await mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount
  );

  console.log(
    `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}

async function transferTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  source: web3.PublicKey,
  destination: web3.PublicKey,
  owner: web3.Keypair,
  amount: number
) {
  const transactionSignature = await transfer(
    connection,
    payer,
    source,
    destination,
    owner,
    amount
  );

  console.log(
    `Transfer Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}

async function burnTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  mint: web3.PublicKey,
  owner: web3.Keypair,
  amount: number
) {
  const transactionSignature = await burn(
    connection,
    payer,
    account,
    mint,
    owner,
    amount
  );

  console.log(
    `Burn Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}

async function closeTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair
) {
  const transactionSignature = await closeAccount(
    connection,
    payer,
    account,
    destination,
    authority
  );

  console.log(
    `Close Account Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}

main()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
  });
