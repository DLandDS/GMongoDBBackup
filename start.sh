#!/bin/bash
# Check if the DATABASE_URL environment variable is set
if [[ -z "$DATABASE_URL" ]]; then
    echo "DATABASE_URL is not set"
    exit 1
fi

# Extract the file path from the DATABASE_URL string and remove "file:"
file_path=$(echo "$DATABASE_URL" | sed 's/file://')

# Check if the file_path starts with "./" and replace it with "./prisma"
file_path=$(echo "$file_path" | sed 's#^\./#./prisma/#')

# Check if the file exists
if [[ -f "$file_path" ]]; then
    bunx prisma db push || { echo "Failed to migrate database"; exit 1; }
else
    bunx prisma migrate deploy || { echo "Failed to migrate database"; exit 1; }
fi

bunx prisma db push
bun run .
