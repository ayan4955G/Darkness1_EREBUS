#!/bin/bash
echo "===================================================="
echo " Starting EREBUS Space Data Center Cloud Application"
echo "===================================================="
docker-compose up --build -d
echo ""
echo "EREBUS container is now running at http://localhost:3000"
echo "Check container status: docker-compose ps"
