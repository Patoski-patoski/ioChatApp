#!/bin/bash
#File to store the last known IP
IP_FILE="./ip_address.txt"
CURRENT_IP=$(curl -s ifconfig.me) 

# Check if the IP file exists
if [ -f "$IP_FILE" ]; then
    LAST_IP=$(cat "$IP_FILE")
    if [ "$CURRENT_IP" != "$LAST_IP" ]; then
        echo "IP has changed from $LAST_IP to $CURRENT_IP"
    fi
fi

# Update the last know IP
echo "$CURRENT_IP" >> "$LAST_IP"