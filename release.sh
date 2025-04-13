#!/usr/bin/env bash
set -e

git diff --quiet HEAD || (echo "please revert the uncommited changes"; exit 1)

VERSION="${1?Missing required argument: semver}"

(echo "$VERSION" | grep -Eq  '^\d+\.\d+\.\d+$') || {
  echo Invalid version string \'"$VERSION"\'. Must be MAJOR.MINOR.PATCH
  exit 1
}

sed -i '' -e "s/version: .*/version: '$VERSION',/" lib/config.js
git add lib/config.js
git commit -m v"$VERSION"
git tag -s v"$VERSION" -m v"$VERSION"
git push
git push origin v"$VERSION"
echo "Released version $VERSION"