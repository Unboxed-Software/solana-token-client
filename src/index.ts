import web3 = require("@solana/web3.js");
import {
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  burn,
  closeAccount,
} from "@solana/spl-token";
import Dotenv from "dotenv";
Dotenv.config();

async function main() {
  const user = initializeKeypair();
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  await connection.requestAirdrop(user.publicKey, web3.LAMPORTS_PER_SOL * 1);

  // createMint returns "PublicKey" of Mint
  const mint = await createMint(
    connection, // connection to Solana cluster
    user, // payer
    user.publicKey, // mint authority
    null, // freeze authority
    2 // decimals
  );

  console.log(
    `Token Mint: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`
  );

  // generate a new Keypair for the Token Account
  const tokenKeyPair = web3.Keypair.generate();

  // createAccount returns "PublicKey" of Token Account
  const tokenAccount = await createAccount(
    connection, // connection to Solana cluster
    user, // payer
    mint, // token mint
    user.publicKey, // token account owner
    tokenKeyPair // new token address
  );

  console.log(
    `User Token Account: https://explorer.solana.com/address/${tokenAccount.toString()}?cluster=devnet`
  );

  // createAssociatedTokenAccount returns "PublicKey" of Associated Token Account
  // Associated Token Account is PDA with user address and mint address as seeds
  const associatedTokenAccount = await createAssociatedTokenAccount(
    connection, //connection to Solana cluster
    user, // payer
    mint, // token mint
    user.publicKey // token account owner
  );

  console.log(
    `User Associated Token Account: https://explorer.solana.com/address/${associatedTokenAccount.toString()}?cluster=devnet`
  );

  // mintTo returns "TransactionSignature"
  const mintTokens = await mintTo(
    connection, // connection to Solana cluster
    user, // payer
    mint, // mint
    associatedTokenAccount, // mint tokens to this token account
    user, // mint authority
    10000 // amount tokens to mint
  );

  console.log(
    `Mint Token Transaction: https://explorer.solana.com/tx/${mintTokens}?cluster=devnet`
  );

  // check tokens minted to Token Account
  const Account = await getAccount(connection, associatedTokenAccount);

  console.log("User Associated Token Account Balance:", Number(Account.amount));

  console.log(
    `User Associated Token Account: https://explorer.solana.com/address/${Account.address}?cluster=devnet`
  );

  // generate new Keypair for receiver
  const receiver = web3.Keypair.generate();

  // create new Associated Token Account for receiver
  const receiverAssociatedTokenAccount = await createAssociatedTokenAccount(
    connection, //connection to Solana cluster
    user, // payer
    mint, // token mint
    receiver.publicKey // token account owner
  );

  // transfer Tokens
  // returns "TransactionSignature"
  const tokenTransfer = await transfer(
    connection, // connection to Solana cluster
    user, // payer
    associatedTokenAccount, // Token Account send Tokens
    receiverAssociatedTokenAccount, // Token Account receive Tokens
    user, // owner of Token Account to send from
    2500 // amount of Tokens to send
  );

  console.log(
    `Transfer Transaction: https://explorer.solana.com/tx/${tokenTransfer}?cluster=devnet`
  );

  // check tokens tranferred from user
  const userAccountAfterTransfer = await getAccount(
    connection,
    associatedTokenAccount
  );

  console.log(
    "User Associated Token Account Balance:",
    Number(userAccountAfterTransfer.amount)
  );

  // check tokens tranferred to receiver
  const receiverAccount = await getAccount(
    connection,
    receiverAssociatedTokenAccount
  );

  console.log(
    "Receiver Associated Token Account Balance:",
    Number(receiverAccount.amount)
  );

  console.log(
    `Receiver Associated Token Account: https://explorer.solana.com/address/${receiverAccount.address}?cluster=devnet`
  );

  // burn Tokens
  // returns "TransactionSignature"
  const burnToken = await burn(
    connection, // connection to Solana cluster
    user, // payer
    associatedTokenAccount, // Token Account burn from
    mint, // Token Mint
    user, // Token Account owner
    2500 // Amount to burn
  );

  // check tokens burned from user
  const userAccountAfterBurn = await getAccount(
    connection,
    associatedTokenAccount
  );

  console.log(
    "User Associated Token Account Balance:",
    Number(userAccountAfterBurn.amount)
  );

  console.log(
    `Burn Transaction: https://explorer.solana.com/tx/${burnToken}?cluster=devnet`
  );

  // close Token Account
  // returns "TransactionSignature"
  const closeTokenAccount = await closeAccount(
    connection, // connection to Solana cluster
    user, // payer
    tokenAccount, // token account to close
    user.publicKey, // account to return token account rent to
    user // token account owner
  );

  console.log(
    `Close Account Transaction: https://explorer.solana.com/tx/${closeTokenAccount}?cluster=devnet`
  );
}

main()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
  });

function initializeKeypair(): web3.Keypair {
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey);
  return keypairFromSecretKey;
}
