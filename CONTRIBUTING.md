# Contributing to PlexArr

Thank you for your interest in contributing to PlexArr! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** describing the problem
2. **Steps to reproduce** the issue
3. **Expected behavior** vs **actual behavior**
4. **Environment details**:
   - Operating system
   - Docker version
   - Browser (for frontend issues)
5. **Logs** if applicable
6. **Screenshots** for UI issues

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Check if the enhancement has already been suggested
2. Provide a clear use case
3. Explain why this enhancement would be useful
4. Consider if it fits the project's scope (low-configuration, unified management)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PlexArr.git
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Backend: `cd backend && npm test`
   - Frontend: `cd frontend && npm test`
   - Manual testing of affected features

5. **Commit your changes**
   ```bash
   git commit -m "Add feature: description of your feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

### Backend Development

```bash
cd backend
npm install
npm run dev  # Starts development server with hot reload
```

The backend runs on `http://localhost:3001`

### Frontend Development

```bash
cd frontend
npm install
npm start  # Starts development server
```

The frontend runs on `http://localhost:3000`

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
PlexArr/
├── backend/              # Express API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── index.ts     # Entry point
│   └── templates/       # Docker compose template
├── frontend/            # React application
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── services/    # API client
│       └── types/       # TypeScript types
└── docker-compose.yml   # PlexArr deployment
```

## Coding Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules
- Use async/await for asynchronous code
- Add JSDoc comments for public APIs
- Keep functions small and focused

### React Components

- Use functional components with hooks
- Keep components focused on single responsibility
- Use meaningful prop names
- Add PropTypes or TypeScript interfaces
- Extract reusable logic into custom hooks

### CSS

- Use semantic class names
- Follow BEM naming convention where appropriate
- Keep styles modular (component-specific)
- Use CSS variables for theming
- Ensure responsive design

### Git Commits

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep commits atomic (one logical change per commit)
- Reference issue numbers when applicable

Example:
```
Add support for custom Docker networks

- Allow users to specify custom network names
- Update wizard to include network configuration
- Add validation for network names

Fixes #123
```

## Adding New Services

To add support for a new service (e.g., Bazarr, Readarr):

1. **Update the template**
   - Add service definition to `backend/templates/stack-template.yml`

2. **Update types**
   - Add service config interface in `backend/src/models/config.model.ts`
   - Mirror types in `frontend/src/types/config.types.ts`

3. **Update docker-compose service**
   - Add generation logic in `backend/src/services/docker-compose.service.ts`

4. **Update wizard**
   - Add service toggle in wizard UI
   - Add configuration step if needed

5. **Update API coordination**
   - Add connection logic in `backend/src/services/api-coordination.service.ts`

6. **Update documentation**
   - Add to README.md service list
   - Update QUICKSTART.md
   - Add configuration instructions

## Documentation

- Update README.md for feature changes
- Update QUICKSTART.md for setup changes
- Add inline comments for complex logic
- Keep documentation up to date with code changes

## Questions?

Feel free to open an issue with the "question" label if you need clarification on anything!

## License

By contributing to PlexArr, you agree that your contributions will be licensed under the MIT License.
