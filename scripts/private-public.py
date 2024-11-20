from eth_keys import keys
from eth_utils import to_checksum_address
import binascii

def private_key_to_address(private_key_hex: str) -> str:
    """
    Convert a private key to an Ethereum address.

    Args:
        private_key_hex (str): The private key as a hex string (with or without '0x' prefix)

    Returns:
        str: The corresponding Ethereum address

    Raises:
        ValueError: If the private key is invalid
    """
    # Remove '0x' prefix if present
    private_key_hex = private_key_hex.replace('0x', '')

    # Ensure the private key is 64 characters (32 bytes)
    if len(private_key_hex) != 64:
        raise ValueError("Private key must be 32 bytes long (64 hex characters)")

    try:
        # Convert the private key to bytes
        private_key_bytes = binascii.unhexlify(private_key_hex)

        # Create a private key object
        private_key = keys.PrivateKey(private_key_bytes)

        # Get the public key
        public_key = private_key.public_key

        # Get the address (converts to checksum address format)
        address = to_checksum_address(public_key.to_address())

        return address

    except Exception as e:
        raise ValueError(f"Invalid private key: {str(e)}")

# Example usage
if __name__ == "__main__":
    # Example private key (don't use this in production!)
    example_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    try:
        address = private_key_to_address(example_private_key)
        print(f"Private Key: 0x{example_private_key}")
        print(f"Address: {address}")
    except ValueError as e:
        print(f"Error: {e}")