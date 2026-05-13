#!/bin/bash
# MongoDB import script for GS Portal data
# Usage: ./import_all.sh "mongodb+srv://USER:PASS@cluster.mongodb.net/DBNAME"

URI="${1:-mongodb://localhost:27017/gs_portal}"
DB=$(echo "$URI" | sed 's/.*\///')
echo "Importing into database: $DB"
echo "URI: $URI"
echo ""

for file in *.json; do
  [ "$file" = "00_README.txt" ] && continue
  coll="${file%.json}"
  echo "Importing $file -> $coll ..."
  mongoimport --uri "$URI" --collection "$coll" --jsonArray --file "$file" --drop
  echo "  Done: $coll"
  echo ""
done

echo "All collections imported."
