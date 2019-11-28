import random
from glob import glob
import json
import os
import re
from vidpy import Clip, Composition
import vidpy.config
from subprocess import call
import shotdetect
from tqdm import tqdm
from multiprocessing import Pool

vidpy.config.MELT_BINARY = "melt"

def download_videos():

    # a non-exaustive list of youtube channels/search patterns for NY real estate 
    vid_lists = [
        ("https://www.youtube.com/playlist?list=PLqIkTqVWbg2-2uL2z5YhV2KvgueWp91GI", None)
        ("https://www.youtube.com/user/thecorcorangroup/", "^[\d].*?(NY|New York)"),
        ("https://www.youtube.com/channel/UCOJzEialegEtLZJTLPRJVng/videos", "^[\d].*?(NY|New York)"),
        ("https://www.youtube.com/user/ellimanvideo/", "^[\d]"),
        ("https://www.youtube.com/channel/UC95vg99Tb_0R6p2fKDIN9LQ/","^Brown Harris Stevens presents"),
        ("https://www.youtube.com/user/sothebysrealty/", "New York"),
    ]

    for vid, pattern in vid_lists:
        args = ["youtube-dl", vid, "-i", "-f", "22"]
        if pattern:
            args += ["--match-title", pattern]
        call(args)

def compose_with_vidpy(
    maxduration=60,
    thresh=0.2,
    fade=0.3,
    duration=4,
    sections=3,
    padding=0.5,
    outname="home.mp4",
):
    shots = {}
    allshots = []

    for f in glob("videos/*.shots.json"):
        # if re.search(r'^videos/\d+', f) is None:
        #     continue

        with open(f, "r") as infile:
            data = json.load(infile)

        f = f.replace(".shots.json", "")

        _shots = [(f, d["time"]) for d in data if d["score"] > thresh]
        _shots = [d["time"] for d in data if d["score"] > thresh]
        shots[f] = []
        for i, d in enumerate(_shots):
            if i > 0:
                start = _shots[i - 1]
            else:
                start = 0
            end = d
            shots[f].append((start, end))

        # if len(_shots) > 5:
        #     shots[f] = _shots
        #     allshots += _shots

    offset = 0
    clips = []
    while offset < maxduration:
        filename = random.choice(list(shots.keys()))
        if len(shots[filename]) < 5:
            continue
        start, end = random.choice(shots[filename])
        start += padding
        end -= padding
        dur = min(end - start, duration - padding)

        clip = Clip(filename, start=start, end=start + dur, offset=offset)
        clip.zoompan([0, 0, "100%", "100%"], ["-25%", "-25%", "150%", "150%"], 0, 100)
        clip.fadein(fade)
        offset += dur - fade
        clips.append(clip)

    # if stitch:
    comp = Composition(clips)
    comp.save(outname)


def extract_shots(thresh=0.2, duration=4, padding=0.5):
    shots = {}
    allshots = []

    for f in glob('videos/*.shots.json'):

        with open(f, 'r') as infile:
            data = json.load(infile)

        f = f.replace('.shots.json', '')

        _shots = [d['time'] for d in data if d['score'] > thresh]
        for i, d in enumerate(_shots):

            if i > 0:
                start = _shots[i-1]
            else:
                start = 0
            end = d

            start += padding
            end -= padding
            end = min(end, start + duration - padding)

            if end - start < 1:
                continue

            print(start, end)

            outname = 'shots/{}_{}_{}.mp4'.format(f.replace('videos/', ''), start, end)
            if os.path.exists(outname):
                continue

            clip = Clip(f, start=start, end=end)
            clip.zoompan([0, 0, '100%', '100%'], ['-25%', '-25%', '150%', '150%'], 0, 100)
            clip.save(outname)


def combine(files=None, maxfiles=180000, outname="home_invader.mp4"):
    if files is None:
        _files = glob("shots/*.mp4")
        _files = sorted(_files, key=lambda f: (f.split(".mp4_")[0], int(f.split(".mp4_")[1].split(".")[0])))
        files = [None]

        # skip first and last
        prevname = None
        for f in _files:
            basename = f.split(".mp4")[0]
            if basename != prevname or prevname is None:
                prevname = basename
                files.pop()
                continue
            files.append(f)
            prevname = basename

        for f in files:
            print(f)

        random.shuffle(files)

        files = files[0:maxfiles]

    for f in files:
        if os.path.exists(f + ".ts"):
            continue
        call(
            [
                "ffmpeg",
                "-y",
                "-i",
                f,
                "-c",
                "copy",
                "-bsf:v",
                "h264_mp4toannexb",
                "-f",
                "mpegts",
                "-q:v",
                "1",
                f + ".ts",
            ]
        )

    files = [f"file '{os.path.abspath(f)}.ts'" for f in files]

    with open("toconcat.txt", "w") as outfile:
        outfile.write("\n".join(files))

    call(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            "toconcat.txt",
            "-c",
            "copy",
            "-f",
            "mp4",
            outname,
        ]
    )

    return outname


def main():
    '''Downloads files, finds and extracts shots'''

    download_videos()
    p = Pool(5)
    p.map(shotdetect.cached_shots, glob('videos/*.mp4'))
    extract_shots()
    combine(maxfiles=100000000000)



if __name__ == "__main__":
    # main()
    # import sys
    combine()

    # combine(sys.argv[1:])
    # args = sys.argv[1:]
    # if len(args) > 0:
    #     combine(args)
    # else:
    #     combine()
    #
