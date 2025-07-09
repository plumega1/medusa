#!/bin/bash

# Exit immediately if a command fails
set -e

echo "Building.."

yarn build

echo "running dashboard "
cd packages/admin/dashboard
yarn dev