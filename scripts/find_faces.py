from glob import glob
import face_recognition
import shutil
import os
import cv2
from multiprocessing import Pool


def first_frame(vidfile):
    try:
        vid = cv2.VideoCapture(vidfile)
        success, image = vid.read()
        vid.release()
        if success:
            return image
        else:
            return None
    except Exception as e:
        return None


def has_face(image):
    try:
        small_frame = cv2.resize(image, (0, 0), fx=0.25, fy=0.25)
        face_locations = face_recognition.face_locations(small_frame, model="cnn")
        return len(face_locations) > 0
    except Exception as e:
        return False


def check_and_move_vid(vidfile):
    frame = first_frame(vidfile)

    if frame is None:
        return False

    if has_face(frame):
        basename = os.path.basename(vidfile)
        newname = "shots_with_faces/" + basename
        print(vidfile, newname)
        shutil.move(vidfile, newname)


def find_vids_with_faces():
    p = Pool(6)
    p.map(check_and_move_vid, glob("shots/*.mp4"))

if __name__ == "__main__":
    find_vids_with_faces()
