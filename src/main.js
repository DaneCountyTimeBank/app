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


// modifying the smart select template to add Cancel/Done buttons
// works for Android but not for iOS
/*
var smart_select_navbar_template = (
    '<div class="navbar {{#if navbarTheme}}theme-{{navbarTheme}}{{/if}}">' +
        '<div class="navbar-inner">' +
            '{{leftTemplate}}' +
            '<div class="center sliding">{{pageTitle}} 444</div>' +
        '</div>' +
    '</div>' +
    '<div class="toolbar">' + //  toolbar-bottom for android
        '<div class="toolbar-inner">' +
            '<a href="#" class="link">Cancel</a>' +
            '<a href="#" class="link">Done</a>' +
        '</div>' +
    '</div>'
);
*/

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
window.isMaterial = true; // !window.Framework7.prototype.device.ios;
window.isiOS = false; // window.Framework7.prototype.device.ios; // b/c supporting both is too much work w/ all the differences

// TODO later: use proper state managment instead of a global event bus
window.timebank_event_bus = new Vue();

// Import F7 iOS Theme Styles
/* eslint-disable global-require */
/*
if (window.isiOS) {
  const Framework7Theme =
    require('framework7/dist/css/framework7.ios.min.css');
  const Framework7ThemeColors =
    require('framework7/dist/css/framework7.ios.colors.min.css');
} else {
*/
  /* OR for Material Theme: */
  const Framework7ThemeMaterial =
    require('framework7/dist/css/framework7.material.min.css');
  const Framework7ThemeColorsMaterial =
    require('framework7/dist/css/framework7.material.colors.min.css');
  
   document.body.className = 'theme-green';
//}

const CustomCSS = require('./assets/custom.css');


// Init F7 Vue Plugin
Vue.use(Framework7Vue);

Vue.component('improved-select', ImprovedSelect);
Vue.component('improved-datepicker', ImprovedDatepicker);

// Init App
// https://framework7.io/docs/init-app.html
new Vue({ // eslint-disable-line no-new
  el: '#app',
  template: '<app />',
  // Init Framework7 by passing parameters here
  framework7: {
    root: '#app',
    swipePanel: 'left',
    routes: Routes,
    material: window.isMaterial,
    smartSelectPickerHeight: window.isiOS ? '85%' : '82%', // '94%',
    //smartSelectNavbarTemplate: smart_select_navbar_template,
    animateNavBackIcon: window.isiOS,
    pushState: true,
    pushStateNoAnimation: true,
    panelLeftBreakpoint: 960,
    preloadPreviousPage: false, // needed to fix iOS going back showing page offset w/ black bar on left and page-on-left class applied erroneously..
    // test swiping to go back a page, may not work if preloadPreviousPage is false..
    // may also want to add 'swipeBackPage: false' if swiping back opens left panel instead of previous page and causes issues..
    // see: https://stackoverflow.com/questions/40146513/framework7-selecting-page-on-center-and-not-page-on-left
    // and: https://muut.com/i/framework7/questions:disable-page-on-left-histo
    //
    uniqueHistory: true, // fixes black page on back to page already been on BUT causes page flash of wrong page when going back..
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
    if (hour === 0) { // b/c there is no 0am/pm
        hour = 12;
    }

    return hour + ':' + min + ' ' + postfix;
}

Vue.filter('timestamp_to_time', timestamp_to_time);


function event_to_datetime_details(event) {
    var start_date_str = timestamp_to_date(event.datetime_start),
        start_time_str = timestamp_to_time(event.datetime_start),
        out = start_date_str + '<br>' + start_time_str;

    if (!event.datetime_end) {
        return out;
    }

    var end_date_str = timestamp_to_date(event.datetime_end),
        end_time_str = timestamp_to_time(event.datetime_end),
        same_day = (start_date_str === end_date_str);

    if (same_day) {
        return out + ' - ' + end_time_str;
    }
    // this isn't going to look very good on the home page..
    return out + '<br>to<br>' + end_date_str + '<br>' + end_time_str;
}

Vue.filter('event_to_datetime_details', event_to_datetime_details);

