# Higherrrrrrr Protocol

> **Higherrrrrrr** – Where cults meet on-chain engineering!

This project is a Solana program built with Anchor. It implements a meme token with evolving metadata, conviction NFT rewards, unique fee mechanics, and more. Follow these instructions to set up your development environment from scratch.

---

## Quick Start (Fresh Install)

If you're starting from scratch with no previous Solana/Anchor installations:

1. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
   source "$HOME/.cargo/env"
   ```

2. **Install Solana CLI:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```
   Add to your shell profile (e.g. ~/.zshrc or ~/.bashrc):
   ```bash
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   ```
   Then reload your shell:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

3. **Install Anchor via AVM:**
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --force
   avm install latest
   avm use latest
   ```

4. **Fix Build Command Compatibility:**
   ```bash
   sudo ln -s $(which cargo-build-sbf) /usr/local/bin/cargo-build-bpf
   ```

5. **Verify Installation:**
   ```bash
   rustc --version
   solana --version
   anchor --version
   ```

Now you're ready to build the project! Run:
```bash
anchor build
```

---

## Detailed Setup Guide

If you need more details or run into issues, see the sections below.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Resetting Your Environment](#resetting-your-environment)
  - [Complete System Reset](#complete-system-reset)
  - [Resetting Rust](#resetting-rust)
  - [Clearing Node Modules](#clearing-node-modules)
- [Installation](#installation)
  - [Install Rust](#install-rust)
  - [Install the Solana CLI](#install-the-solana-cli)
  - [Install Anchor CLI Using AVM](#install-anchor-cli-using-avm)
- [Building the Project](#building-the-project)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Additional Information](#additional-information)

---

## Prerequisites

- **macOS** or **Linux/WSL**  
- **Git**  
- **Node.js** (v14 or later) and **npm**  
- Internet connection

---

## Resetting Your Environment

### Complete System Reset

For a completely fresh start, follow these steps:

1. **Remove Solana Configuration and Binaries:**

   ```bash
   # Remove Solana CLI configuration
   rm -rf ~/.config/solana

   # Remove Solana cache
   rm -rf ~/.cache/solana

   # Remove Solana installation directory
   rm -rf ~/.local/share/solana
   ```

2. **Remove Anchor and AVM Files:**

   ```bash
   # Remove Anchor cache/config
   rm -rf ~/.anchor

   # Remove AVM's stored versions
   rm -rf ~/.avm

   # Uninstall Anchor CLI and AVM if installed via Cargo
   cargo uninstall anchor-cli
   cargo uninstall avm
   ```

### Resetting Rust

If you want to completely reset your Rust installation (for a clean start):

1. **Uninstall rustup (and Rust toolchains):**

   ```bash
   rustup self uninstall
   ```

2. **Remove residual directories:**

   ```bash
   rm -rf ~/.cargo ~/.rustup
   ```

*Note: This will remove all globally installed Cargo binaries and toolchain data.*

### Clearing Node Modules

To remove all Node.js dependencies and start fresh:

```bash
rm -rf node_modules
rm -f package-lock.json  # (or yarn.lock if you use Yarn)
npm install
```

---

## Installation

### Install Rust

Rust is required for writing Solana programs. The recommended installation method is via rustup.

1. Install Rust with:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
   ```

2. Reload your shell's environment:

   ```bash
   . "$HOME/.cargo/env"
   ```

3. Verify the installation:

   ```bash
   rustc --version
   ```

   You should see output similar to:

   ```
   rustc 1.80.1 (3f5fd8dd4 2024-08-06)
   ```

### Install the Solana CLI

The Solana CLI provides tools to build and deploy Solana programs.

1. Install the Solana CLI by running:

   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

2. If prompted, update your PATH. For example, add the following line to your shell profile (e.g., `~/.bashrc` or `~/.zshrc`):

   ```bash
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   ```

3. Verify the installation:

   ```bash
   solana --version
   ```

   Expected output (version numbers may vary):

   ```
   solana-cli 1.18.22 (src:9efdd74b; feat:4215500110, client:Agave)
   ```

### Install Anchor CLI Using AVM

The Anchor Version Manager (AVM) lets you manage multiple Anchor versions easily.

1. **Install AVM:**

   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --force
   ```

2. **Verify AVM is installed:**

   ```bash
   avm --version
   ```

3. **Install the desired Anchor CLI version (e.g., v0.30.1):**

   ```bash
   avm install 0.30.1
   avm use 0.30.1
   ```

4. **Verify Anchor CLI:**

   ```bash
   anchor --version
   ```

   You should see:

   ```
   anchor-cli 0.30.1
   ```

*If you encounter errors regarding dependency versions (e.g. with the `time` crate), see the troubleshooting section below.*

### Fix Build Command Compatibility

If you encounter the error `no such command: 'build-bpf'`, create a symlink to fix the build-sbf/build-bpf compatibility:

1. **Find the cargo-build-sbf path:**

   ```bash
   which cargo-build-sbf
   ```

2. **Create the symlink:**

   ```bash
   sudo ln -s $(which cargo-build-sbf) /usr/local/bin/cargo-build-bpf
   ```

3. **Verify the symlink:**

   ```bash
   ls -l /usr/local/bin/cargo-build-bpf
   ```

---

## Building the Project

In the project root (where `Anchor.toml` and `Cargo.toml` reside), run:

```bash
anchor build
```

This compiles the Solana program in `programs/protocol` and produces deployable artifacts.

---

## Running Tests

The project includes integration tests written in TypeScript.

1. Ensure Node.js dependencies are installed:

   ```bash
   npm install
   ```

2. Run tests via Anchor:

   ```bash
   anchor test
   ```

   Alternatively, if your `package.json` includes a test script, run:

   ```bash
   npm run test
   ```

---

## Project Structure

- **Anchor.toml** – Main configuration for the Anchor project.
- **Cargo.toml** – Workspace configuration that includes the Solana program.
- **docs/TOKENOMICS.md** – Detailed tokenomics and design overview.
- **programs/protocol/** – The Rust program implementing the protocol.
- **tests/** – Integration tests in TypeScript.
- **migrations/** – (Optional) Deployment migration scripts.

---

## Additional Information

- **Local Cluster:** The project is configured to use a local Solana network (`localnet`). To run a local validator, use:
  
  ```bash
  solana-test-validator
  ```

- **Wallet:** Your provider wallet is defined in `Anchor.toml` (default: `~/.config/solana/id.json`). If you need a new wallet, run:

  ```bash
  solana-keygen new
  ```

- **Deploying the Program:** When you're ready to deploy to your local cluster, run:

  ```