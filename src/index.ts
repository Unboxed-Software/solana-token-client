import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"

async function createNewMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey,
    decimals: number
): Promise<web3.PublicKey> {
    const tokenMint = await token.createMint(
        connection,
        payer,
        mintAuthority,
        freezeAuthority,
        decimals
    )

    console.log(
        `Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
    )

    return tokenMint
}

async function createTokenAccount(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    owner: web3.PublicKey
) {
    const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
    )

    console.log(
        `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
    )

    return tokenAccount
}

async function mintTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    destination: web3.PublicKey,
    authority: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.mintTo(
        connection,
        payer,
        mint,
        destination,
        authority,
        amount
    )

    console.log(
        `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}

async function approveDelegate(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  delegate: web3.PublicKey,
  owner: web3.Signer | web3.PublicKey,
  amount: number
) {
  const transactionSignature = await token.approve(
    connection,
    payer,
    account,
    delegate,
    owner,
    amount
  )

  console.log(
    `Approve Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function revokeDelegate(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  owner: web3.Signer | web3.PublicKey,
) {
  const transactionSignature = await token.revoke(
    connection,
    payer,
    account,
    owner,
  )

  console.log(
    `Revote Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function transferTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    source: web3.PublicKey,
    destination: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.transfer(
        connection,
        payer,
        source,
        destination,
        owner,
        amount
    )

    console.log(
        `Transfer Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}

async function burnTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    mint: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.burn(
        connection,
        payer,
        account,
        mint,
        owner,
        amount
    )

    console.log(
        `Burn Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}

async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"), 'confirmed')
    const user = await initializeKeypair(connection)

    const mint = await createNewMint(
        connection,
        user,
        user.publicKey,
        user.publicKey,
        2
    )
    
    const mintInfo = await token.getMint(connection, mint);

    const tokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        user.publicKey
    )

    await mintTokens(
      connection,
      user,
      mint,
      tokenAccount.address,
      user,
      100 * 10 ** mintInfo.decimals
    )

    const delegate = web3.Keypair.generate();
    await approveDelegate(
      connection,
      user,
      tokenAccount.address,
      delegate.publicKey,
      user.publicKey,
      50 * 10 ** mintInfo.decimals
    )

    const receiver = web3.Keypair.generate().publicKey
    const receiverTokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        receiver
    )

    await transferTokens(
      connection,
      user,
      tokenAccount.address,
      receiverTokenAccount.address,
      delegate,
      50 * 10 ** mintInfo.decimals
    )

    await revokeDelegate(
      connection,
      user,
      tokenAccount.address,
      user.publicKey,
    )

    await burnTokens(
      connection,
      user,
      tokenAccount.address,
      mint,
      user,
      25 * 10 ** mintInfo.decimals
    )
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
