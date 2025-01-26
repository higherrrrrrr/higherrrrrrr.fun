import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Protocol } from "../target/types/protocol";
import { assert } from "chai";

describe("protocol", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.Protocol as Program<Protocol>;

  it("Runs the minimal instruction!", async () => {
    const tx = await program.methods
      .initialize()
      .rpc();
    console.log("Transaction signature:", tx);

    // If no error, assume success
    assert.isOk(true);
  });
});
