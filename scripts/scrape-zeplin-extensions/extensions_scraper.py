from selenium import webdriver
from bs4 import BeautifulSoup
import json

# URL of the website to scrape
url = "https://extensions.zeplin.io/"

# Initialize Selenium webdriver (make sure you have the appropriate driver installed)
driver = webdriver.Chrome()  # You can replace "Chrome" with the browser of your choice

# Open the URL
driver.get(url)

# Wait for some time to ensure that the content is loaded (you may need to adjust the wait time)
driver.implicitly_wait(10)  # Waits for 10 seconds

# Get the page source after waiting
page_source = driver.page_source

# Parse HTML content
soup = BeautifulSoup(page_source, 'html.parser')

# Find all elements with class "card"
cards = soup.find_all(class_="card")

# List to store scraped data
extensions = []

# Iterate over each card and extract relevant information
for card in cards:
    author_full = card.find(class_="cardContentText").find("h3").text.strip().rstrip("/")
    author = author_full.split(" ", 1)[0]
    strong_tag = card.find(class_="cardContentText").find("strong")
    extensionName = strong_tag.text.strip() if strong_tag else ""
    description = card.find(class_="cardContentText").find("p").text.strip()
    downloads = card.find(class_="projectNumberWrapper").find("span")["title"]
    avatar = card.find(class_="avatarFrame").find("img")["src"]
    
    # Create a dictionary for the current extension
    extension = {
        "author": author,
        "extensionName": extensionName,
        "description": description,
        "downloads": downloads,
        "avatar": avatar
    }
    
    # Append the extension dictionary to the list
    extensions.append(extension)

# Quit the driver
driver.quit()

# Convert the list of dictionaries to JSON
extensions_json = json.dumps(extensions, indent=4)

# Write JSON data to a file
with open("extensions.json", "w") as outfile:
    outfile.write(extensions_json)

print("JSON data saved to extensions.json file.")
