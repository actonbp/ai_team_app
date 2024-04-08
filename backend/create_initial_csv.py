import os
import csv

# Define the path for the CSV file
csv_file_path = os.path.join('backend', 'data', 'chatSessions.csv')
# Define the CSV headers
csv_headers = ['ProlificID', 'SessionID', 'RaisedHandCount', 'OtherInfo', 'SelfCond', 'TeamRace']

# Check if the data directory exists, if not, create it
if not os.path.exists(os.path.dirname(csv_file_path)):
    os.makedirs(os.path.dirname(csv_file_path))

# Check if the CSV file already exists to avoid overwriting it
if not os.path.exists(csv_file_path):
    with open(csv_file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(csv_headers)
