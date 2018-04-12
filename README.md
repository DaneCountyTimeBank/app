A web and mobile app for the Dane County TimeBank.

Built with Vue.js, Framework7 and jDrupal.


**Usage**

Install dependencies by running: 

  `npm install`

Run a hot-reloading development server on your localhost:

  `npm run dev`

Build and deploy to production:

`npm run build && rsync -avz [PATH_TO_CODE_DIRECTORY]/www/ root@danecountytimebank.org:/var/www/app`
