# Publishing Guide for ngx-json-editor

This guide explains how to publish the `ngx-json-editor` library to npm.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup) if you don't have one.

2. **npm Login**: Log in to npm from your terminal:
   ```bash
   npm login
   ```

## Pre-Publishing Checklist

- [ ] All tests pass: `npm test`
- [ ] Changes are committed to git
- [ ] You have verified the build: `npm run publish:dry-run`

## Publishing Steps

### 1. Run the Automated Publishing Script

From the workspace root, run the following command specifying the version increment type (`patch`, `minor`, or `major`):

```bash
npm run publish:lib -- patch
```

This script will:
1. Update the version in `projects/ngx-json-editor/package.json`.
2. Build the library.
3. Prompt for confirmation.
4. Publish to npm.

### 2. Verify the Publication

After publishing, verify at:
- https://www.npmjs.com/package/ngx-json-editor

## Version Management

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.x.x): Breaking changes
- **MINOR** version (x.1.x): New features, backward compatible
- **PATCH** version (x.x.1): Bug fixes, backward compatible

## Git Tagging (Recommended)

After publishing, the script will suggest commands to tag the release:

```bash
git add .
git commit -m "Release v1.0.0"
git tag -a v1.0.0 -m "Version v1.0.0"
git push origin main --tags
```

## Troubleshooting

- **"You do not have permission to publish"**: Ensure you're logged in (`npm whoami`) and have owner rights.
- **"Version already exists"**: You must increment the version before publishing again.
