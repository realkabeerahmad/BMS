#!/bin/bash

# Enhanced start.sh script with error handling, logging, and environment checks

# Define folders and files
FOLDERS=("./logs" "./logs/Controllers" "./logs/auth")
FILES=("./logs/root.log" "./logs/Controllers/UserController.log" "./logs/auth/auth.log")
LOG_FILE="./logs/startup.log"

# Function to log messages
log_message() {
    local message="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" | tee -a "$LOG_FILE"
}

# Check and create folders if they don't exist
for folder in "${FOLDERS[@]}"; do
    if [ ! -d "$folder" ]; then
        log_message "Folder $folder does not exist. Creating..."
        if ! mkdir -p "$folder"; then
            log_message "ERROR: Failed to create folder $folder. Exiting."
            exit 1
        fi
    else
        log_message "Folder $folder already exists. Continuing..."
    fi
done

# Check and create files if they don't exist
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_message "File $file does not exist. Creating..."
        if ! touch "$file"; then
            log_message "ERROR: Failed to create file $file. Exiting."
            exit 1
        fi
    else
        log_message "File $file already exists. Continuing..."
    fi
done

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_message "ERROR: .env file not found. Please create one. Exiting."
    exit 1
fi

Load environment variables
log_message "Loading environment variables from .env..."
if ! source .env; then
    log_message "ERROR: Failed to load .env file. Exiting."
    exit 1
fi

# Check if required environment variables are set
# REQUIRED_VARS=("PORT" "DB_URI" "JWT_SECRET")
# for var in "${REQUIRED_VARS[@]}"; do
#     if [ -z "${!var}" ]; then
#         log_message "ERROR: Required environment variable $var is not set. Exiting."
#         exit 1
#     fi
# done

# Start the server
log_message "All required files and folders are set up."
log_message "Starting server with nodemon..."

# Redirect nodemon output to the log file
nodemon main.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Log server start
log_message "Server started with PID $SERVER_PID. Check $LOG_FILE for further insights."

# Trap to handle script termination
trap "log_message 'Shutting down server...'; kill $SERVER_PID; exit 0" SIGINT SIGTERM

# Keep the script running
wait $SERVER_PID