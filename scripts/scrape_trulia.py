import json
import time
import glob
import os
import random
import re
import requests

cookies = {
    "_pxhd": "fa4bccfc81a36a4ce646bdb04e07e7b94e0f8aa943f8b4577037d1d7731c41d9:3c86c3b1-e304-11e9-abdf-793333d5c7b4",
    "tlftmusr": "190929pym512l3pddgfuwlfe159jm368",
    "_csrfSecret": "y0ck_YigtiQ8xqVolhOR5trO",
    "tabc": "%7B%22958%22%3A%22a%22%2C%221163%22%3A%22b%22%2C%221165%22%3A%22c%22%7D",
}

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:69.0) Gecko/20100101 Firefox/69.0",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.trulia.com/NY/New_York/2_p/",
    "content-type": "application/json",
    "x-csrf-token": "OFK38Jxd-NfM3DXsu5kL74WmOrNF-Rl5Zx04",
    "Origin": "https://www.trulia.com",
    "DNT": "1",
    "Connection": "keep-alive",
    "TE": "Trailers",
}

params = (("opname", "WEB_searchMapMarkerHomes"),)

with open("trulia_query.gql") as infile:
    query_data = infile.read()


def get_listings(page=1, limit=200, offset=0, minprice=0, maxprice=10000000):
    data = {
        "operationName": "WEB_searchMapMarkerHomes",
        "variables": {
            "heroImageFallbacks": ["STREET_VIEW", "SATELLITE_VIEW"],
            "searchDetails": {
                "searchType": "FOR_SALE",
                "location": {"cities": [{"city": "New York", "state": "NY"}]},
                "filters": {
                    "sort": {"type": "PRICE", "ascending": False},
                    "page": page,
                    "limit": limit,
                    "offset": offset,
                    "price": {"min": minprice, "max": maxprice},
                    "propertyTypes": [],
                    "listingTypes": [],
                    "pets": [],
                    "rentalListingTags": [],
                    "foreclosureTypes": [],
                    "buildingAmenities": [],
                    "unitAmenities": [],
                    "landlordPays": [],
                },
            },
            "includeOffMarket": False,
            "isSPA": False,
        },
        "query": query_data,
    }

    data = json.dumps(data)

    response = requests.post(
        "https://www.trulia.com/graphql",
        headers=headers,
        params=params,
        cookies=cookies,
        data=data,
    )

    return response.json()["data"]["mapMarkerHomes"]["homes"]


def make_price_ranges():
    # lower bound, upper bound, and increment
    range_params = [
        (0, 400_000, None),
        (400_000, 1_000_000, 50_000),
        (1_000_000, 3_000_000, 200_000),
        (3_000_000, 6_000_000, 500_000),
        (6_000_000, 200_000_000, None),
    ]

    price_ranges = []

    for start, end, inc in range_params:
        if inc is None:
            price_ranges.append((start, end))
            continue
        for amount in range(start, end, inc):
            price_ranges.append((amount + 1, amount + inc))

    return price_ranges


def download_file(url, local_filename):
    if local_filename is None:
        local_filename = url.split("/")[-1]

    if os.path.exists(local_filename):
        return local_filename

    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    return local_filename


def clean_image_url(url):
    return re.sub(r"[^aA-zZ0-9.-]", "_", url)


def get_floorplans():
    for f in glob.glob("dirty_trulia_json/*.json"):
        with open(f, "r") as infile:
            data = json.load(infile)
        for home in data:
            urls = [p["url"]["src"] for p in home["media"]["photos"]]
            if len(urls) > 0:
                last_image = urls[-1]
                outname = "potential_floorplans/" + clean_image_url(last_image)
                if os.path.exists(outname) or os.path.exists(outname.replace('potential_', '')):
                        print(outname)
                # try:
                #     download_file(last_image, outname)
                # except Exception as e:
                #     continue


def get_images():
    with open('all_apartments.json', "r") as infile:
        data = json.load(infile)
    for home in data:
        urls = [p["src"] for p in home["images"]]
        # skip the last image
        for url in urls[:-1]:
            outname = "images/" + clean_image_url(url)
            download_file(url, outname)


def consolidate_json_files():
    out = []

    for f in glob.glob("dirty_trulia_json/*.json"):

        with open(f, "r") as infile:
            data = json.load(infile)

        for d in data:

            hoa_fee = 0
            if d.get("hoaFee"):
                hoa_fee = d["hoaFee"]["amount"]["price"]

            beds = 0
            if d["bedrooms"]:
                if d["bedrooms"]["summaryBedrooms"].lower() != "studio":
                    beds = float(d["bedrooms"]["summaryBedrooms"].split(" ")[0])

            baths = 0
            if d["bathrooms"]:
                baths = float(d["bathrooms"]["summaryBathrooms"].split(" ")[0])

            size = 0
            if d["floorSpace"]:
                size = float(
                    d["floorSpace"]["formattedDimension"].split(" ")[0].replace(",", "")
                )

            provider = d.get("provider")

            if provider is None:
                provider = {}

            agent = provider.get("agent", {})

            broker = provider.get("broker", {})

            if broker:
                broker = broker.get("name")

            property_type = d.get('propertyType')

            if property_type:
                property_type = property_type['formattedValue']

            item = {
                "address": d["location"]["homeFormattedAddress"],
                "neighborhood": d["location"]["neighborhoodName"],
                "lat": d["location"]["coordinates"]["latitude"],
                "lng": d["location"]["coordinates"]["longitude"],
                "url": d["url"],
                "id": d["metadata"]["compositeId"],
                "baths": baths,
                "beds": beds,
                "size": size,
                "title": d["pageText"]["title"],
                "price": float(re.sub(r"[$,+]", "", d["price"]["formattedPrice"])),
                "description": d["description"]["value"],
                "images": [p["url"] for p in d["media"]["photos"]],
                "hoa": hoa_fee,
                "agent": agent,
                "broker": broker,
                "type": property_type
            }

            out.append(item)

    with open("all_apartments.json", "w") as outfile:
        json.dump(out, outfile)


def get_all_listings(limit=200, maxpages=200):

    for page in range(1, maxpages):
        outname = "dirty_trulia_json/page_{}.json".format(str(page).zfill(4))
        if os.path.exists(outname):
            continue

        results = get_listings(
            page=page,
            offset=(page - 1) * limit,
            limit=limit,
            minprice=0,
            maxprice=500_000_000,
        )

        if len(results) == 0:
            return True

        with open(outname, "w") as outfile:
            json.dump(results, outfile)

        time.sleep(random.uniform(1, 3))


if __name__ == "__main__":
    import argparse
    from pprint import pprint

    # get_all_listings()
    # consolidate_json_files()
    # get_floorplans()

    results = get_listings(limit=20, offset=0, page=1, minprice=9_950_000, maxprice=9_950_000)
    for r in results:
        print('https://trulia.com' + r['url'])
        print(r)
