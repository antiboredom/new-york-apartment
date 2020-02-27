import json

from scrape_trulia import get_all_listings, consolidate_json_files
from parse_apartments import get_meta

if __name__ == "__main__":

    # get_all_listings()
    # consolidate_json_files()

    with open("all_apartments.json", "r") as infile:
        data = json.load(infile)

    data = get_meta(data)

    with open("meta.json", "w") as outfile:
        json.dump(data, outfile)


