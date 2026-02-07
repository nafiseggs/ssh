#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Facebook Album Poster - Command Line Version
Designed to be called from Node.js server
"""

import sys
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import json
import time
import os
import sys
import argparse

class FacebookAlbumPoster:
    def __init__(self, cookies_file="account.txt", headless=True):
        """Initialize with your Facebook cookies"""
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--disable-gpu')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Suppress logging
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 20)
        
        # Load cookies and login
        self._load_cookies(cookies_file)
        
    def _load_cookies(self, cookies_file):
        """Load Facebook cookies from account.txt"""
        print("🔐 Loading Facebook session...", flush=True)
        self.driver.get("https://www.facebook.com")
        time.sleep(2)
        
        with open(cookies_file, 'r') as f:
            cookies = json.load(f)
        
        for cookie in cookies:
            try:
                self.driver.add_cookie({
                    'name': cookie['key'],
                    'value': cookie['value'],
                    'domain': cookie.get('domain', '.facebook.com'),
                    'path': cookie.get('path', '/')
                })
            except Exception as e:
                print(f"Cookie error: {e}", flush=True)
        
        # Refresh to apply cookies
        self.driver.refresh()
        time.sleep(3)
        print("✅ Logged into Facebook", flush=True)
    
    def post_to_album(self, album_id, image_path, caption=""):
        """
        Post image to Facebook group album using direct upload URL
        """
        try:
            # Use the DIRECT upload URL
            upload_url = f"https://www.facebook.com/media/set/upload/oa.{album_id}/"
            print(f"📂 Opening upload page...", flush=True)
            self.driver.get(upload_url)
            time.sleep(4)
            
            # Get absolute path
            abs_path = os.path.abspath(image_path)
            if not os.path.exists(abs_path):
                raise Exception(f"Image not found: {abs_path}")
            
            print(f"🔍 Looking for upload button...", flush=True)
            
            # Try to click "Upload photos or videos" button
            try:
                upload_btn = self.wait.until(EC.element_to_be_clickable((
                    By.XPATH, 
                    "//span[contains(text(), 'Upload photos or videos')]"
                )))
                upload_btn.click()
                print("✅ Clicked upload button", flush=True)
                time.sleep(2)
            except:
                print("⚠️ Upload button not found, looking for file input...", flush=True)
            
            # Find file input
            print("📤 Uploading image...", flush=True)
            
            file_input = self.wait.until(EC.presence_of_element_located((
                By.XPATH, 
                "//input[@type='file']"
            )))
            
            # Upload image
            file_input.send_keys(abs_path)
            print(f"✅ Image uploaded: {os.path.basename(abs_path)}", flush=True)
            time.sleep(6)  # Wait for upload to complete
            
            # Add caption if provided
            if caption and caption.strip():
                try:
                    print("✍️ Adding caption...", flush=True)
                    time.sleep(2)
                    
                    # Look for caption box
                    caption_selectors = [
                        "//div[@contenteditable='true']",
                        "//textarea[@placeholder]",
                        "//div[@role='textbox']"
                    ]
                    
                    caption_box = None
                    for selector in caption_selectors:
                        try:
                            boxes = self.driver.find_elements(By.XPATH, selector)
                            if boxes:
                                caption_box = boxes[0]
                                break
                        except:
                            continue
                    
                    if caption_box:
                        caption_box.click()
                        time.sleep(0.5)
                        caption_box.send_keys(caption)
                        print("✅ Caption added", flush=True)
                    else:
                        print("⚠️ Could not find caption box", flush=True)
                    
                    time.sleep(1)
                except Exception as e:
                    print(f"⚠️ Caption error: {e}", flush=True)
            
            # Click Post button
            print("📮 Posting to album...", flush=True)
            time.sleep(2)
            
            post_selectors = [
                "//span[text()='Post']",
                "//div[@aria-label='Post']",
                "//button[contains(text(), 'Post')]"
            ]
            
            posted = False
            for selector in post_selectors:
                try:
                    post_btns = self.driver.find_elements(By.XPATH, selector)
                    if post_btns:
                        post_btns[-1].click()
                        print("✅ Post button clicked!", flush=True)
                        time.sleep(6)
                        posted = True
                        break
                except:
                    continue
            
            if not posted:
                raise Exception("Could not find Post button")
            
            print("✅ Successfully posted to album!", flush=True)
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return False
    
    def close(self):
        """Close browser"""
        try:
            self.driver.quit()
        except:
            pass


def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Post image to Facebook album')
    parser.add_argument('--album-id', required=True, help='Facebook album ID')
    parser.add_argument('--image-path', required=True, help='Path to image file')
    parser.add_argument('--caption', default='', help='Post caption')
    parser.add_argument('--no-headless', action='store_true', help='Show browser window')
    
    args = parser.parse_args()
    
    # Create poster
    headless = not args.no_headless
    poster = FacebookAlbumPoster("account.txt", headless=headless)
    
    try:
        # Post to album
        success = poster.post_to_album(
            args.album_id,
            args.image_path,
            args.caption
        )
        
        if success:
            print("\n🎉 SUCCESS!", flush=True)
            sys.exit(0)  # Success exit code
        else:
            print("\n❌ FAILED!", flush=True)
            sys.exit(1)  # Error exit code
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        poster.close()


if __name__ == "__main__":
    main()