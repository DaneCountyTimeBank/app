<template>
  <f7-page name="exchange">
    <f7-navbar sliding back-link="Back">
      <f7-nav-center>
        Record an Exchange
      </f7-nav-center>
    </f7-navbar>

    <f7-block class="center-preloader" v-if="!loaded && !load_error">
        <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading {{load_error}}, please try again later.
    </f7-block>

    <template v-if="!load_error && loaded">

    <template v-if="post_id">
        <f7-block>
            <template v-if="earned">
                You are taking payment from 
            </template>
            <template v-if="spent">
                You are paying
            </template>
            <a :href="user_id | profile_link">{{user_name}}</a>
            for "<a :href="post_id | post_link">{{description}}</a>".
        </f7-block>
        <f7-list form class="inputs-list">
          <f7-list-item>
            <f7-label>Hours</f7-label>
            <f7-input v-model.trim="hours" type="text" placeholder="eg. 1:45"/>
          </f7-list-item>
          <f7-list-item>
            <f7-label>Date</f7-label>
            <improved-datepicker v-model="date" :max-date="max_date"></improved-datepicker>
          </f7-list-item>
          <f7-list-item v-if="display_categories && loaded && !category_ids_preloaded" smart-select smart-select-open-in="picker" title="Categories" class="display-categories-select">
            <improved-select v-model="category_ids" :options="display_categories"></improved-select>
          </f7-list-item>
          <f7-list-item>
            <f7-button @click="submitExchange" class="button button-fill button-raised">Submit</f7-button>
          </f7-list-item>
        </f7-list>
    </template> <!-- form duplicated partially above b/c the description-hint below makes it hack to style the below form to appear like the above -->
    <template v-else>
        <f7-list form class="inputs-list">
          <f7-list-item v-model="exchange_type" class="push-radio" radio name="exchange-type" value="earned" input-value="earned" title="I earned"></f7-list-item>
          <f7-list-item v-model="exchange_type" class="push-radio" radio name="exchange-type" value="spent" input-value="spent" title="I spent"></f7-list-item>
          <f7-list-item>
            <f7-label>Hours</f7-label>
            <f7-input v-model.trim="hours" type="text" placeholder="eg. 1:45"/>
          </f7-list-item>
          <f7-list-item>
            <f7-label>Description</f7-label>
            <f7-input v-model.trim="description" :disabled="!custom" type="text" placeholder="" maxlength="255" />
          </f7-list-item>
        </f7-list>
        <div class="description-hint">
            Don't include names in your description as this information will be made public.
        </div>
        <f7-list form class="inputs-list">
          <f7-list-item>
            <f7-label>With</f7-label>
            <f7-input v-model="user_name" :disabled="true" type="text" placeholder=""/>
          </f7-list-item>
          <f7-list-item>
            <f7-label>Date</f7-label>
            <improved-datepicker v-model="date" :max-date="max_date"></improved-datepicker>
          </f7-list-item>
          <f7-list-item v-if="display_categories && loaded && !category_ids_preloaded" smart-select smart-select-open-in="picker" title="Categories" class="display-categories-select">
            <improved-select v-model="category_ids" :options="display_categories"></improved-select>
          </f7-list-item>
          <f7-list-item>
            <f7-button @click="submitExchange" class="button button-fill button-raised">Submit</f7-button>
          </f7-list-item>
        </f7-list>
    </template>

    <f7-actions :opened="exchange_recorded">
      <f7-actions-group>
        <f7-actions-label bold>Exchange recorded!</f7-actions-label>
        <f7-actions-label class="exchange-recorded-current-balance">Your balance is now: {{current_balance}}</f7-actions-label>
        <f7-actions-button @click="gotoUserExchanges">View Your Exchanges</f7-actions-button>
        <f7-actions-button @click="gotoRecordExchange()">Record Another</f7-actions-button>
        <f7-actions-button @click="gotoRecordExchange(user_id)">Record Another with {{user_name}}</f7-actions-button>
        <f7-actions-button @click="gotoHome">Home</f7-actions-button>
      </f7-actions-group>
    </f7-actions>

    </template>

  </f7-page>
</template>

<script>

    import Timebank from '../timebank';
    import {escape as lodash_escape} from 'lodash';


    export default {
        name: 'Exchange',
        data () {

            var max_date = new Date(),
                user_name = this.$root.view_user_name,
                post_id = this.$route.query.post_id,
                user_id = this.$route.query.user_id;

            var defaults = {
                max_date: max_date, // don't allow selecting a date before today
                date: max_date, //max_date.getFullYear() + '-' + (max_date.getMonth() + 1) + '-' + max_date.getDate(),

                post_id: post_id,
                user_id: user_id,
                custom: !post_id,
                hours: '',
                description: '',
                exchange_type: '',
                user_name: user_name || ('Member ' + user_id),
                spent: false,
                earned: false,
                category_ids: [],
                category_ids_preloaded: false,
                display_categories: null,

                exchange_recorded: false,
                new_transaction_id: null,
                edit_post: null,

                user_loaded: false,
                post_loaded: false,
                categories_loaded: false,
                current_balance: '?',
                load_error: null,
            };

            this.setExchangePost(this.$root.post, defaults);            

            return defaults;
        },

        computed: {
            loaded () {
                return this.user_loaded && this.post_loaded && this.categories_loaded;
            }
        },

        filters: {
            profile_link: user_id => `/member/${user_id}`,
            post_link: post_id => `/post/${post_id}`,
        },

        methods: {

            setExchangePost(post, data) {
                if (!post) return;

                data.description = post.title;

                var current_user_id = localStorage.user_id * 1,
                    post_user_id = post.user_id * 1,
                    own_post = (post_user_id === current_user_id);

                if (post.type === 'offer') {
                    if (own_post) {
                        data.earned = true;
                    } else {
                        data.spent = true;
                    }
                } else {
                    if (own_post) {
                        data.spent = true;
                    } else {
                        data.earned = true;
                    }
                }

                if (post.categories) {
                    var category_ids = post.categories.map(c => c.id);
                    if (category_ids.length > 0) {
                        data.category_ids = category_ids;
                        data.category_ids_preloaded = true;
                    }
                }
            },

            gotoUserExchanges () {
                this.$router.load({url: '/exchanges'});
            },

            gotoHome () {
                this.$router.load({url: '/home'});
            },

            gotoRecordExchange (user_id) {
                var url;
                if (user_id) {
                    url = `/posts?user_id=${user_id}&exchange=1`;
                } else {
                    url = '/members/exchange';
                }
                this.$router.load({url: url});
            },

            parseHours () {
                var total_hours,
                    num_hours,
                    num_minutes,
                    err,
                    display;

                if (!this.hours) {
                    err = 'Please enter an hours amount.';
                } else if (this.hours.indexOf('.') >= 0) {
                    if (!/^(\d+)?\.(0|00|25|5|50|75)$/.test(this.hours)) {
                        err = 'Please enter an hours amount rounded to the nearest quarter hour (eg. 3, 3.25, 3.5, 3.75).';
                    } else {
                        total_hours = parseFloat(this.hours);
                        num_hours = this.hours[0] === '.' ? 0 : parseInt(total_hours);
                        num_minutes = (total_hours - num_hours) * 60;
                    }
                } else if (this.hours.indexOf(':') >= 0) {
                    if (!/^(\d+)?:(0|00|15|30|45)$/.test(this.hours)) {
                        err = 'Please enter an hours amount rounded to the nearest quarter hour (eg. 3, 3:15, 3:30, 3:45).';
                    } else {
                        var parts = this.hours.split(':');
                        num_hours = this.hours[0] === ':' ? 0 : parseInt(parts[0]);
                        num_minutes = parseInt(parts[1]);

                        total_hours = num_hours + (num_minutes / 60);
                    }
                } else if (/^\d+$/.test(this.hours)) { // is a whole number
                    total_hours = num_hours = parseInt(this.hours);
                    num_minutes = 0;
                } else {
                    err = 'Please enter a valid hours amount.';
                }
                
                if (!err && total_hours <= 0) {
                    err = 'Please enter an hours amount > 0.';
                }

                if (!err) {
                    display = Timebank.hour_minute_display(num_hours, num_minutes);
                }

                return {hours: total_hours, display: display, error: err};
            },

            // extract to timebank.js?
            dateToString (dt) {
                var check_add_zero = function(n) { 
                    if (n < 10) {
                        return '0' + n;
                    }
                    return n;
                };

                return dt.getFullYear() + '-' + check_add_zero(dt.getMonth() + 1) + '-' + check_add_zero(dt.getDate());
            },

            submitExchange () {

                var err,
                    hours_data = this.parseHours(),
                    date = this.dateToString(this.date);

                if (!this.earned && !this.spent && !this.exchange_type) {
                    err = "Please select whether you've earned or spent hours.";
                } else if (hours_data.error) {
                    err = hours_data.error;
                } else if (!this.description) {
                    err = 'Please describe the exchange.';
                } else if (!date) {
                    err = 'Please select a date.';
                } else {
                    var now = this.dateToString(new Date());

                    if (date > now) {
                        err = "Please choose a date that's not in the future.";
                    }
                }
                if (!err && this.category_ids.length === 0) { // XXX: are categories required? should they be?
                    err = 'Please select a category for this exchange.';
                }

                if (err) {
                    this.$f7.addNotification({message: err, hold: 3500});
                    return;
                }

                var payer,
                    payee,
                    current_user_id = localStorage.user_id,
                    pay_txt;

                if (this.earned || this.exchange_type === 'earned') {
                    payer = this.user_id;
                    payee = current_user_id;
                    pay_txt = 'Claiming payment from ';
                } else if (this.spent || this.exchange_type === 'spent') {
                    payer = current_user_id;
                    payee = this.user_id;
                    pay_txt = 'Paying ';
                }

                var args = {
                    description: this.description,
                    payer: payer,
                    payee: payee,
                    hours: hours_data.hours,
                    date: date,
                    category_ids: this.category_ids,
                };

                var self = this;

                // XXX: this is pretty long, should probably break it up into more methods..

                var cutoff = 30 * 3, // a line's worth is probably around 30 characters, so keep it under about 3 lines
                    short_desc = this.description.slice(0, cutoff);
                if (this.description.length > cutoff) {
                    short_desc += '...';
                }

                var confirm_msg = (
                    pay_txt + lodash_escape(this.user_name) + '<br><br>' +
                    'Amount: ' + hours_data.display + '<br><br>' +
                    'For: ' + lodash_escape(short_desc) + '<br><br>' +
                    'On: ' + date
                );

                self.$f7.confirm(confirm_msg, 'Confirm Exchange', function(){

                    self.$f7.showPreloader('Recording exchange..');

                    // XXX: what happens if user has no balance?

                    Timebank.create_transaction(args, function(data){

                        var n = parseFloat(data.balance), // may be negative
                            display = '';

                        if (n < 0) {
                            display = '-';
                            n = Math.abs(n);
                        }

                        var num_hours = parseInt(n),
                            num_minutes = (n - num_hours) * 60;

                        if (num_hours === 0 && num_minutes === 0) {
                            display = '0hrs';
                        } else {
                            // XXX: could always show hours if that would be less confusing than just showing minutes when hours is 0..
                            if (num_hours >= 1) {
                                display += (
                                    num_hours + 'hr' +
                                    (num_hours === 1 ? '' : 's') +
                                    ' '
                                );
                            }
                            if (num_minutes) {
                                display += num_minutes + 'min';
                            }
                        }

                        //console.log('created transaction, got', data, data.balance, num_hours, num_minutes, display);

                        /*
                        0hrs
                        1hr
                        1hr 30min
                        2hrs
                        45min
                        -15min
                        3hrs 15min
                        -4hrs 30min
                        */

                        self.current_balance = display;

                        /* website shows balance at https://timebank-testsite.org/user/4383/statement
                        
                        Hrs 3:45mins
                        -Hrs 3:00
                        Hrs 0:00
                        Hrs 3:00

                        */

                        self.$f7.hidePreloader();

                        self.exchange_recorded = true; // triggers actionsheet to show

                    }, function(status, message){

                        self.$f7.hidePreloader();

                        //console.log('transaction error', status, message);

                        var err;
                        //if (message.indexOf('?') > -1) {
                        //    err = 'Error - ?';
                        //} else {
                            err = 'Uknown error - please try again later.';
                        //}
                        if (err) {
                            self.$f7.addNotification({message: err, hold: 3500});
                        }
                    });

                }); // end confirm

            },

        },

        created () {

            var self = this;

            if (!self.user_id) {
                self.$nextTick(() => { // redirect doesn't work during created, so have to delay it
                    // must have user selected before using this page
                    self.$router.load({url: '/members/exchange'});
                });
                return;
            }

            if (this.$route.query.post_id) {
                
                // have to fetch to get post categories b/c post data from the posts page don't contain category data
                // XXX: could have the api return category data for those posts but it might slow down the queries a bit..

                Timebank.get_post(
                    this.$route.query.post_id,
                    post => {
                        this.setExchangePost(post, this);
                        this.post_loaded = true;
                    },
                    (status, msg) => {
                        this.load_error = 'post';
                    }
                );

            } else {
                this.post_loaded = true;
            }

            if (!this.$root.view_user_name && this.user_id) {
                Timebank.get_user(
                    this.user_id, 
                    user => {
                        this.user_name = user.name;
                        this.user_loaded = true;
                    },
                    (status, msg, logged_out) => {
                        // really only 404's that might prevent an exchange if the user_id passed is invalid
                        // but all sort of other edge case errors too, eg.
                        //    can't connect to server to check user so user_id may be invalid or valid but can't know
                        // so just treat all user load errors the same

                        if (logged_out) {
                            window.timebank_event_bus.$emit('session-expired');
                        } else {
                            this.load_error = 'user';
                        }
                    }
                );
            } else {
                this.user_loaded = true;
            }

            Timebank.get_post_categories(display_categories => {

                this.display_categories = display_categories;
                this.categories_loaded = true;

            }, (status, msg) => {
                this.load_error = 'categories';
            });
        },

    };
</script>

<style>

.description-hint {
    margin: -22px 0;
    margin-top: -30px;
    padding: 0 16px;

    font-size: 12px;
    color: #8c2762;
    font-style: italic;
}

.exchange-recorded-current-balance {
    /*font-style: italic;*/
    /*padding-top: 0 !important;*/
    color: #4193ff !important;

}

</style>
