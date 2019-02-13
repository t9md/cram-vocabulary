# -*- coding: utf-8 -*-

import sys
import os
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
import time
import errno
from optparse import OptionParser

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise

def save_snapshot(driver, word, idx):
    fname = os.path.join(Options.dir, "%s.png" % word)
    idx = "%03d" % (idx + 1)

    if os.path.isfile(fname):
        print("  [SKIP] %s: %s exists!" % (idx, fname))
        return
        # img_size = os.popen("file %s" % fname).read().strip()
        # if "PNG image data, 2560 x 1440" in img_size:
        #     print "  [SKIP] %s: %s exists!" % (idx, fname)
        #     return
        # else:
        #     os.remove(fname)

    time.sleep(1)

    url_template = Engines[Options.engine]
    driver.get(url_template % word)

    if Options.engine.startswith("google"):
        element = driver.find_element_by_id("res")
    else:
        element = driver.find_element_by_id("vm_c")

    ActionChains(driver).move_to_element(element).perform()
    driver.execute_script("document.body.style.overflow = 'hidden';")
    driver.save_screenshot(fname)
    print("  [SAVE] %s: %s" % (idx, fname))

def get_words_from_file(fname):
    with open(fname) as f:
        content = f.readlines()
    content = [x.split("\t")[0] for x in content]
    return content

def retrieve_snapshot_for_words(driver, words):
    for idx, word in enumerate(words):
        save_snapshot(driver, word, idx)

Options = {}
Engines = {
    "google": 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&safe=active&q=%s',
    "google_unsafe": 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&q=%s',
    "bing": 'https://www.bing.com/images/search?safeSearch=Moderate&mkt=en-US&q=%s',
    "bing_unsafe": 'https://www.bing.com/images/search?safeSearch=Off&mkt=en-US&q=%s',
}


def main():
    global Options

    usage = "usage: %prog [options] word-list"
    parser = OptionParser(usage=usage)
    parser.add_option("-d", "--dir", dest="dir", help="Directory to write captured images.", default="slideshow/imgs")
    parser.add_option("-w", "--window", dest="window", help="Window size. 1280x720 by default.", default="1280x720")
    parser.add_option("-e", "--engine", dest="engine", help="Image serch engine to use one of %s" % Engines.keys(), default="google")
    (Options, args) = parser.parse_args()

    if Options.engine not in Engines:
        print("Engine must be one of %s" % Engines.keys())
        exit(1)

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless')
    driver = webdriver.Chrome(options=chrome_options)

    (screen_width, screen_height) = Options.window.split("x")
    driver.set_window_size(screen_width, screen_height)
    print(Options)

    mkdir_p(Options.dir)

    for file in args:
        print(file + ': start')
        retrieve_snapshot_for_words(driver, get_words_from_file(file))
    driver.quit()

main()
