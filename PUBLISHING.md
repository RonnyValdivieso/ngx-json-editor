# Publishing Guide for ngx-json-editor

This guide explains how to publish the `ngx-json-editor` library to npm.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup) if you don't have one.

2. **npm Login**: Log in to npm from your terminal:
   ```bash
   npm login
   ```
   Enter your username, password, and email when prompted.

3. **Package Name Availability**: The package name `ngx-json-editor` must be available on npm. You can check at:
   https://www.npmjs.com/package/ngx-json-editor

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Library builds successfully: `ng build ngx-json-editor`
- [ ] Version number is updated in `projects/ngx-json-editor/package.json`
- [ ] CHANGELOG.md is updated with the new version
- [ ] README.md is up to date
- [ ] All changes are committed to git
- [ ] You've created a git tag for the version (optional but recommended)

## Publishing Steps

### 1. Build the Library

From the workspace root:

```bash
ng build ngx-json-editor
```

This creates the production build in `dist/ngx-json-editor/`.

### 2. Navigate to the Dist Folder

```bash
cd dist/ngx-json-editor
```

### 3. Verify the Package (Optional but Recommended)

Run a dry-run to see what will be published:

```bash
npm publish --dry-run
```

This shows you:
- Package name and version
- Files that will be included
- Package size
- Any warnings or errors

### 4. Publish to npm

For the first publish:

```bash
npm publish
```

For subsequent updates, if you want to publish a beta or pre-release version:

```bash
npm publish --tag beta
```

### 5. Verify the Publication

After publishing, verify at:
- https://www.npmjs.com/package/ngx-json-editor
- Install in a test project: `npm install ngx-json-editor`

## Version Management

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.x.x): Breaking changes
- **MINOR** version (x.1.x): New features, backward compatible
- **PATCH** version (x.x.1): Bug fixes, backward compatible

### Updating the Version

Update the version in `projects/ngx-json-editor/package.json`:

```json
{
  "version": "1.0.1"
}
```

Or use npm version commands from the library directory:

```bash
cd projects/ngx-json-editor
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

## Git Tagging (Recommended)

After publishing, tag the release in git:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Automated Publishing with GitHub Actions (Optional)

You can automate publishing using GitHub Actions. Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: ng build ngx-json-editor
      - run: cd dist/ngx-json-editor && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To use this:
1. Create an npm access token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add it as a secret named `NPM_TOKEN` in your GitHub repository settings
3. Create a GitHub release to trigger the workflow

## Troubleshooting

### "You do not have permission to publish"

- Ensure you're logged in: `npm whoami`
- Check package name availability
- Verify you have publish rights (for scoped packages)

### "Version already exists"

- Update the version number in package.json
- You cannot republish the same version

### "Package name too similar to existing package"

- Choose a different package name
- Consider using a scoped package: `@your-org/ngx-json-editor`

## Unpublishing (Use with Caution)

You can unpublish a version within 72 hours of publishing:

```bash
npm unpublish ngx-json-editor@1.0.0
```

**Warning**: Unpublishing is discouraged as it can break projects depending on your package.

## Support

For issues with publishing, contact:
- npm support: https://www.npmjs.com/support
- Check npm documentation: https://docs.npmjs.com/
