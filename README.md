# higherrrrrrr.fun monorepo

Higherrrrrrr is a next-generation social trading platform that introduces novel mechanics for community engagement and trading experiences.

Good place to start is the [documentation](./documentation/README.md) that goes over the entire project. Each software component has its own README.

## Project Structure

```
├── documentation/     # All project design docs and whitepapers (Start here)
├── scripts/           # Build and deployment scripts
├── services/         
│   ├── evm/          # Ethereum Virtual Machine related services
│   │   ├── alpha/    # Frontend for alpha EVM interface
│   │   ├── api/      # Core API services
│   │   ├── higherrrrrrr-protocol/ # Core protocol implementation
│   │   ├── ponder/   # Data indexing service
│   │   ├── rpc/      # RPC node interface
│   │   └── subgraphs/# GraphQL APIs for data querying
│   └── landing/      # Landing page
├── .gitignore       
├── .gitmodules      
├── LICENSE          
└── README.md        
```

## Core Components

### EVM Services

- **Alpha**: Frontend interface for EVM protocol interactions
- **API**: RESTful services for platform interaction
- **Higherrrrrrr Protocol**: Core smart contracts and protocol logic
- **Ponder**: Data indexing service for efficient querying
- **RPC**: Node interface for blockchain interaction
- **Subgraphs**: GraphQL APIs for data analytics and queries

### Frontend

- **Landing**: Project landing page

## Getting Started

Clone the repository:
```bash
git clone git@github.com:higherrrrrrr/higherrrrrrr.fun.git
cd higherrrrrrr.fun
```

Each service contains its own README with specific setup and development instructions.

## Contributing

We welcome contributions! Here's how to get started:

### Branch Naming Convention
- Features: `feature/description`
- Bugfixes: `fix/description`
- Documentation: `docs/description`
- Performance: `perf/description`

### Commit Messages
Follow the Conventional Commits specification:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc)
- `refactor:` Code changes that neither fix bugs nor add features
- `perf:` Performance improvements
- `test:` Adding or modifying tests
- `chore:` Changes to build process or auxiliary tools

### Pull Request Process
1. Update documentation for any new features
2. Update the CHANGELOG.md if applicable
3. Get approval from at least one core team member
4. Ensure CI passes and no conflicts exist
5. Squash commits into a single meaningful commit
6. Rebase on latest main branch

### Code Style
- Use ESLint and Prettier configurations provided
- Write meaningful variable names
- Comment complex logic
- Write unit tests for new features
- Follow existing patterns in the codebase

## Support

Join our Telegram community: [https://t.me/+S2iLDGxRggU5Y2Jh](https://t.me/+S2iLDGxRggU5Y2Jh)

## License

This project is licensed under the WAGMI License (MIT compatible).

## Contributors

[![Contributors](https://contrib.rocks/image?repo=higherrrrrrr/higherrrrrrr.fun)](https://github.com/higherrrrrrr/higherrrrrrr.fun/graphs/contributors)
