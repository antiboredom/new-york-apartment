'''Determines if an image is a floorplan or not'''
import os
import shutil
import cv2
from glob import glob
from tqdm import tqdm
import numpy as np

potential_folder = 'potential_floorplans'
out_folder = 'floorplans'

def is_floorplan(imgpath, thresh=0.7):
    img = cv2.imread(imgpath, cv2.IMREAD_GRAYSCALE)
    percent_white = np.sum(img == 255) / img.size
    return percent_white >= thresh

def classify_folder():
    for f in tqdm(glob(potential_folder + "/*.jpg")):
        if is_floorplan(f):
            shutil.move(f, out_folder + "/" + os.path.basename(f))

if __name__ == '__main__':
    classify_folder()
