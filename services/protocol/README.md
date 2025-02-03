# Higherrrrrrr Protocol

> **Higherrrrrrr** – Where cults meet on-chain engineering!

This project is a Solana program built with Anchor. It implements a meme token with evolving metadata, conviction NFT rewards, unique fee mechanics, and more. Follow these instructions to reset your environment, install all prerequisites, and get started with development.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Resetting Your Environment](#resetting-your-environment)
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

2. Reload your shell’s environment:

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

- **Deploying the Program:** When you’re ready to deploy to your local cluster, run:

  ```bash
  anchor deploy
  ```

- **Troubleshooting Dependency Issues:**  
  If you encounter errors such as:

  ```
  error[E0282]: type annotations needed for `Box<_>`
  ```
  
  This is due to an outdated dependency version (e.g. the `time` crate). To fix this when installing via AVM, you may need to:
  
  1. Clone the Anchor repo locally,
  2. Update the dependency (e.g., force `time` to version `>=0.3.35` using a patch override in `Cargo.toml`), and then
  3. Install Anchor CLI from your local copy:
     
     ```bash
     cargo install --path . --locked --force anchor-cli
     ```
     
  However, using AVM should typically handle version management for you.

---

Happy hacking with the Higherrrrrrr Protocol!
```

---

### How to Use This README

1. **Replace your current `README.md`** with the content above.
2. **Adjust any sections as needed** (for example, tool versions or environment-specific instructions).
3. **Follow the step‑by‑step instructions** to reset your environment and install all dependencies.

This README provides a comprehensive guide modeled on the official Anchor documentation and covers everything from resetting your environment to building and testing the project. If you need further customization or run into issues, feel free to ask!