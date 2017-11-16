/* global window document f7 */

import 'babel-polyfill';

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
/* eslint-disable no-unused-vars */
import Framework7 from 'framework7';
import Framework7Vue from 'framework7-vue';

import Routes from './routes';
import App from './App';

import ImprovedSelect from './components/ImprovedSelect';
import ImprovedDatepicker from './components/ImprovedDatepicker';


// TODO later: upgrade to vue-loader v13+ once I figure out why it breaks things (presumably a configuration option..)

/*
// to ease debugging via console
// causes webpack error though..
// https://stackoverflow.com/questions/30648101/debugging-in-devtools-with-webpack
require.ensure([], function() {
  window.require = function(amodule) {
    return require('./' + amodule); // this single line causes a webpack error
    // seems to be b/c webpack tries to statically extract dependencies but this code allow for dynamic dependencies..
  };
});
*/


// Set up some useful globals
window.isMaterial = !window.Framework7.prototype.device.ios;
window.isiOS = window.Framework7.prototype.device.ios;

// TODO later: use proper state managment instead of a global event bus
window.timebank_event_bus = new Vue();

// Import F7 iOS Theme Styles
/* eslint-disable global-require */
if (window.isiOS) {
  const Framework7Theme =
    require('framework7/dist/css/framework7.ios.min.css');
  const Framework7ThemeColors =
    require('framework7/dist/css/framework7.ios.colors.min.css');
} else {
  /* OR for Material Theme: */
  const Framework7ThemeMaterial =
    require('framework7/dist/css/framework7.material.min.css');
  const Framework7ThemeColorsMaterial =
    require('framework7/dist/css/framework7.material.colors.min.css');
}

// Init F7 Vue Plugin
Vue.use(Framework7Vue);

Vue.component('improved-select', ImprovedSelect);
Vue.component('improved-datepicker', ImprovedDatepicker);

// Init App
new Vue({ // eslint-disable-line no-new
  el: '#app',
  template: '<app />',
  // Init Framework7 by passing parameters here
  framework7: {
    root: '#app',
    swipePanel: 'left',
    routes: Routes,
    material: window.isMaterial,
    animateNavBackIcon: window.isiOS,
    pushState: true,
    pushStateNoAnimation: true,
    panelLeftBreakpoint: 960
  },
  // Register App Component
  components: {
    app: App
  }
});


function handleBackButton () {
  // NOTE: The back button will behave differently depending on circumstance
  // If the side panel is open, close it
  if (document.querySelector('.panel-left.active')) {
    // This will do nothing when the split-view is open
    return window.f7.closePanel();
  }
  // Close modals
  // @TODO How to handle modals we shouldn't close like a login-screen?
  if (document.querySelector('.modal-in')) {
    return f7.closeModal();
  }
  // If we have a back button, we want it to go back
  if (f7.mainView.history.length > 1) {
    return f7.mainView.router.back();
  }
  // Default to closing the app
  return window.navigator.app.exitApp();
}

// Ye olde Device Ready
document.addEventListener('deviceready', () => {
  // Bind to the back button for Android
  document.addEventListener('backbutton', handleBackButton);
});



var monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function timestamp_to_date(unix_timestamp) {
    // eg. "1484670484" -> March 7, 2017
    var d = new Date(unix_timestamp*1000);

    return monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

Vue.filter('timestamp_to_date', timestamp_to_date);

/*
function timestamp_to_short_date(dt) {
    return (new Date(pdate * 1000)).toISOString().split('T')[0];
}
*/

function timestamp_to_time(unix_timestamp) {
    var d = new Date(unix_timestamp*1000),
        hour = d.getHours(),
        min = d.getMinutes(),
        postfix = 'AM';

    if (min < 10) {
        min = '0' + min;
    }


    if (hour >= 12 && hour <= 23) {
        postfix = 'PM';
    }
    if (hour > 12) {
        hour -= 12;
    }

    return hour + ':' + min + ' ' + postfix;
}

Vue.filter('timestamp_to_time', timestamp_to_time);




