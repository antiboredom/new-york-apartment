import json
from glob import glob
import os
from math import sqrt
import openpyscad as ops
from subprocess import call
from scrape_trulia import clean_image_url

openscad_path = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
all_files = glob("/Users/sam/projects/new-york-apartment/floorplans/*.json")
wall_height = 4
apt_keyed = {}
apt_order = []

with open("all_apartments_bak.json", "r") as infile:
    apt_data = json.load(infile)
    apt_data = sorted(apt_data, key=lambda a: a["price"], reverse=True)
    for index, a in enumerate(apt_data):
        if len(a["images"]) == 0:
            continue
        img = clean_image_url(a["images"][-1]["src"])
        a["sam_id"] = index
        apt_keyed[img] = a


def loadit(jpath):
    with open(jpath, "r") as infile:
        data = json.load(infile)

    k = os.path.basename(jpath.replace(".plan.json", ""))
    data["meta"] = apt_keyed[k]

    return data


def get_ratio(data):
    xs = []
    ys = []

    for coords in data["walls"]:
        for c in coords:
            xs.append(c[0])
            ys.append(c[1])

    minx = min(xs)
    maxx = max(xs)
    miny = min(ys)
    maxy = max(ys)

    plan_width = maxx - minx
    plan_height = maxy - miny
    plan_area = plan_width * plan_height

    real_area = data["meta"]["size"]

    # real_area == plan_width * ratio * plan_height * ratio
    ratio = sqrt(real_area / plan_area)

    return ratio


def create_plan(data, outname, wall_height=9, ratio=0.05):
    union = ops.Union()
    for coords in data["walls"]:
        z = 0
        x = coords[0][0]
        y = coords[0][1]
        w = coords[1][0] - x
        h = coords[2][1] - y

        offsety = -y * ratio - h * ratio

        c = ops.Cube([w * ratio, h * ratio, wall_height]).translate(
            [x * ratio, offsety, z]
        )
        union.append(c)

    diff = ops.Difference()
    diff.append(union)

    for coords in data["doors"]:
        z = 0
        x = coords[0][0]
        y = coords[0][1]
        w = coords[1][0] - x
        h = coords[2][1] - y

        offsety = -y * ratio - h * ratio

        c = ops.Cube([w * ratio, h * ratio, wall_height * 0.75]).translate(
            [x * ratio, offsety, z]
        )
        diff.append(c)

    for coords in data["windows"]:
        z = wall_height * 0.5
        x = coords[0][0]
        y = coords[0][1]
        w = coords[1][0] - x
        h = coords[2][1] - y

        offsety = -y * ratio - h * ratio

        c = ops.Cube([w * ratio, h * ratio, wall_height * 0.33]).translate(
            [x * ratio, offsety, z]
        )
        diff.append(c)

    scadfile = "out.scad"
    diff.write(scadfile)
    call([openscad_path, "-o", outname, scadfile])


def export_all():
    for f in all_files:
        print(f)

        data = loadit(f)
        outname = "stls/{}.stl".format(data["meta"]["sam_id"])

        if os.path.exists(outname):
            continue

        try:
            ratio = get_ratio(data)
            create_plan(data, outname, ratio=ratio)
        except Exception as e:
            continue


if __name__ == "__main__":
    export_all()
    # convert_to_glb()

# data = loadit(all_files[20])
# print(all_files[20])
# ratio = get_ratio(data)
# # data = loadit("floorplans/https___static.trulia-cdn.com_pictures_thumbs_6_zillowstatic_IS233zbuirabou1000000000.jpg.plan.json")
# # create_plan(data, all_files[0] + ".stl")
# create_plan(data, "test.stl", ratio=ratio)
