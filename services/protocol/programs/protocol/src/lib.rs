use anchor_lang::prelude::*;

declare_id!("Prot111111111111111111111111111111111111111");

#[program]
pub mod protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Memecoin Protocol!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
