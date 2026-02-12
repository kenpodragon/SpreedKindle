# Kreeder
Repo for Speed Reading Extension for Kindle Cloud Reader

This plugin implements SwirtRead but on the Kindle Cloud Reader pages (since those devs didn't want to figure out the Kindle format).
It extracts the text from the kindle reader page (stored in a weird div), then displays it in the popup. It then pages through the text as required and updates the reading position in Kindle Cloud Reader as well (so when it stops you flip to the correct page where the reading left off).



#SwiftRead
https://chromewebstore.google.com/detail/swiftread-read-faster-lea/ipikiaejjblmdopojhpejjmbedhlibno?utm_source=chrome-ntp-icon

#Kindle web reader:
https://read.amazon.com/

TODO:
* OCR Accuracy is weird at times (not that accurate at times, and is a bit slow). Look to impove OCR accuracy and speed.
* Would like to get this fixed so it works with automatic reading mode (meaning it will automatically advance to the next page). In this instance would like to have an OCR in the background setting (fetch in the background so it's ready to continue once the most recent block of text is extracted).
* Need to understand the licensing structre for Teseseract OCR and if I need to include anything here in the files/legal bits, etc... to mention this is being utilized (Add into something going out in the licensing file and in the about kreeder pages).
* Also need to figure out and add in update/upgrade instructions to fetch/pull in the latest version of tesseract (if/when it's updated).
* Need to change the notifications and other bits on there to remove the kreeder.net domain (point to [does-god-exist.org/kreeder](https://does-god-exist.org/kreeder/) - also need to create a web page there to re-announce Kreeder).
* Update the Chrome Extension Store and re-upload the plugin.
* Manually changing the page on the back end (web page), doesn't have a way to trigger the Kreeder on the front to refresh.