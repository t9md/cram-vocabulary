# -*- coding: utf-8 -*-

import sys
import os
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
import time

def save_snapshot(driver, word, idx):
    fname = 'slideshow/imgs/%s.png' % word
    idx = "%03d" % (idx + 1)

    if os.path.isfile(fname):
        img_size = os.popen("file %s" % fname).read().strip()
        if "PNG image data, 2560 x 1440" in img_size:
            print "  [SKIP] %s: %s exists!" % (idx, fname)
            return
        else:
            os.remove(fname)

    time.sleep(1)
    driver.get('https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&q=' + word)
    element = driver.find_element_by_id("res")
    ActionChains(driver).move_to_element(element).perform()
    driver.execute_script("document.body.style.overflow = 'hidden';")
    driver.save_screenshot(fname)
    print "  [SAVE] %s: %s" % (idx, fname)

def get_words_from_file(fname):
    with open(fname) as f:
        content = f.readlines()
    content = [x.split("\t")[0] for x in content]
    return content

def retrieve_snapshot_for_words(driver, words):
    for idx, word in enumerate(words):
        save_snapshot(driver, word, idx)

def main():
    files = sys.argv[1:]

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)

    driver.set_window_size(1280, 720)
    print driver.get_window_size()
    # raw_input("Start: ")

    for file in files:
        print file, ': start'
        retrieve_snapshot_for_words(driver, get_words_from_file(file))
    driver.quit()

main()
