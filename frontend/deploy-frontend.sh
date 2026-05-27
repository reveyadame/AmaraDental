#!/bin/bash
set -e

npm ci
VITE_API_URL=https://api.ciodent.mx npm run build
