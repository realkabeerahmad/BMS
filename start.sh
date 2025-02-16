#!/bin/bash

# Define folders and files
FOLDERS=("./logs" "./logs/Controllers")
FILES=("./logs/root.log" "./logs/Controllers/UserController.log")

# Check and create folders if they don't exist
for folder in "${FOLDERS[@]}"; do
    if [ ! -d "$folder" ]; then
        echo "Folder $folder does not exist. Creating..."
        mkdir -p "$folder"
    else
        echo "Folder $folder already exists. Continuing..."
    fi
done

# Check and create files if they don't exist
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "File $file does not exist. Creating..."
        touch "$file"
    else
        echo "File $file already exists. Continuing..."
    fi
done

# Further actions
echo "All required files and folders are set up."

# Further actions
echo "Going to start server..."
node main.js & echo "Server started please check logs folder for further insights"