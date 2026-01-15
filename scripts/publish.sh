#!/bin/bash

# Exit on error
set -e

# Default version type
VERSION_TYPE=${1:-patch}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Invalid version type. Use 'patch', 'minor', or 'major'."
  exit 1
fi

echo "🚀 Preparing to publish version increment: $VERSION_TYPE"

# 1. Update version in the library package.json
echo "📦 Updating version in projects/ngx-json-editor..."
cd projects/ngx-json-editor
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
cd ../..

echo "✅ Version updated to $NEW_VERSION"

# 2. Build the library
echo "🏗️ Building library..."
npm run build:lib

# 3. Final verification
echo "🔍 Verifying build output..."
if [ ! -d "dist/ngx-json-editor" ]; then
  echo "Error: Build failed, dist folder not found."
  exit 1
fi

# 4. Prompt for confirmation
read -p "⚠️ Ready to publish $NEW_VERSION to npm. Proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled."
    exit 1
fi

# 5. Publish
echo "🚀 Publishing to npm..."
cd dist/ngx-json-editor
npm publish --access public
cd ../..

echo "🎉 Success! ngx-json-editor $NEW_VERSION is now on npm."
echo "Don't forget to commit your changes and tag the release:"
echo "git add ."
echo "git commit -m \"Release $NEW_VERSION\""
echo "git tag -a $NEW_VERSION -m \"Version $NEW_VERSION\""
echo "git push origin main --tags"
