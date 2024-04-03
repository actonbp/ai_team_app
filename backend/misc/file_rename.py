import os

# Set the directory
os.chdir("/Users/bacton/Documents/GitHub/ai_team_app/backend/misc/files")

# Get all .png files in the current directory
png_files = [f for f in os.listdir(".") if f.endswith(".png")]

# Sort the files if needed
png_files.sort()

# Rename each file to "avatar_X.png"
for index, file in enumerate(png_files, start=1):
    new_name = f"avatar_{index}.png"
    os.rename(file, new_name)
    print(f"Renamed {file} to {new_name}")
