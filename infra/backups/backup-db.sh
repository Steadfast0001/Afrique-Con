#!/bin/bash
# =========================================================================
# Database Automated Backup Script
# This script creates compressed backup dumps of the staging databases.
# Can be run via cron (e.g. daily).
# =========================================================================

# Exit immediately if any command fails
set -e

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +\%Y-\%m-\%d_\%H-\%M-\%S)
RETENTION_DAYS=7

# Load configurations if environment file exists
if [ -f ../.env ]; then
  source ../.env
fi

# Ensure backup directories exist
mkdir -p "${BACKUP_DIR}/buea"
mkdir -p "${BACKUP_DIR}/douala"

# 1. Backup Buea Staging Database
echo "Starting Buea database backup..."
docker exec postgres_buea_staging pg_dump -U "${BUEA_DB_USER:-postgres}" "${BUEA_DB_NAME:-buea_db}" | gzip > "${BACKUP_DIR}/buea/buea_${DATE}.sql.gz"
echo "Buea database backup completed: ${BACKUP_DIR}/buea/buea_${DATE}.sql.gz"

# 2. Backup Douala Akwa Staging Database
echo "Starting Douala Akwa database backup..."
docker exec postgres_douala_staging pg_dump -U "${DOUALA_DB_USER:-postgres}" "${DOUALA_DB_NAME:-douala_db}" | gzip > "${BACKUP_DIR}/douala/douala_${DATE}.sql.gz"
echo "Douala Akwa database backup completed: ${BACKUP_DIR}/douala/douala_${DATE}.sql.gz"

# 3. Apply Retention Policy (Delete files older than RETENTION_DAYS)
echo "Applying retention policy (retaining last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Retention clean up complete."
