<template>
  <f7-page name="newpost">
    <f7-navbar sliding :back-link="edit_post_id && 'Back'">
      <f7-nav-left v-if="!edit_post_id">
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
        {{title}}
      </f7-nav-center>
    </f7-navbar>

    <f7-block class="center-preloader" v-if="!loaded && !load_error">
        <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading - please try again later.
    </f7-block>

    <f7-list form v-if="loaded && !load_error" class="inputs-list">
      <f7-list-item group-title :title="header_text"></f7-list-item>
      <template v-if="!edit_post_id">
        <f7-list-item v-model="post_type" class="push-radio" radio name="offer-want" value="offer" input-value="offer" title="Offering"></f7-list-item>
        <f7-list-item v-model="post_type" class="push-radio" radio name="offer-want" value="want" input-value="want" title="Requesting"></f7-list-item>
      </template>

      <f7-list-item>
        <f7-label>Title</f7-label>
        <f7-input v-model.trim="post_title" type="text" placeholder=""/>
      </f7-list-item>

      <!-- TODO: make this auto-grow to a bigger height based on contents (but maybe have a max height) -->
      <f7-list-item>
        <f7-label>Details</f7-label>
        <f7-input v-model.trim="details" type="textarea" placeholder=""></f7-input>
      </f7-list-item>

      <f7-list-item v-if="display_categories" smart-select smart-select-open-in="picker" title="Categories" class="new-post-categories">
        <improved-select v-model="category_ids" :options="display_categories"></improved-select>
      </f7-list-item>

      <f7-list-item>
        <f7-label>Expires</f7-label>
        <improved-datepicker v-model="end_date" :min-date="min_date" :max-date="max_date"></improved-datepicker>
      </f7-list-item>

      <f7-list-item>
        <f7-button @click="submitPost()" class="button button-fill button-raised">Submit</f7-button>
      </f7-list-item>

    </f7-list>


    <f7-actions :opened="post_submitted">
      <f7-actions-group>
        <f7-actions-label bold>{{submitted_text}}</f7-actions-label>
        <f7-actions-button @click="viewPost">View Your Post</f7-actions-button>
        <f7-actions-button @click="hideActionSheet">{{submitted_hide_text}}</f7-actions-button>
      </f7-actions-group>
    </f7-actions>


  </f7-page>
</template>

<script>

    import Timebank from '../timebank';

    // XXX: an alternative datepicker.. https://github.com/charliekassel/vuejs-datepicker

    // TODO later: allow image uploading

    // GET args / GET parameters (eg. this.$route.query[param_name] )

    export default {
        name: 'NewPost',
        data () {
            var now_ms = (new Date()).getTime(),
                year_from_now_ms = now_ms + (364*24*3600*1000), // minus 1 day b/c a year is the max

                edit_post_id = this.$route.params.post_id,

                wording = 'Offer / Request',

                defaults = {
                    edit_post_id: edit_post_id,

                    title: (edit_post_id ? 'Edit' : 'List') + ' ' + wording,
                    display_categories: null,
                    min_date: new Date(now_ms + 24*3600), // don't allow selecting a date before tomorrow
                    max_date: new Date(year_from_now_ms),

                    header_text: 'I am..',
                    post_type: '',
                    post_title: '',
                    details: '',
                    category_ids: [],
                    end_date: new Date(year_from_now_ms), // works for initial assignment but doesn't track datepicker changes

                    post_submitted: false,
                    new_post_id: null,
                    edit_post: null,
                    submitted_text: edit_post_id ? 'Updated!' : 'Submitted!',
                    submitted_hide_text: edit_post_id ? 'Continue editing' : ('List ' + wording),
                    edit_post_loaded: false,
                    post_categories_loaded: false,
                    load_error: false,
                };

            if (edit_post_id) {
                this.setEditPost(this.$root.post, defaults);
            }
            return defaults;
        },

        methods: {

            setEditPost(edit_post, data) {
                if (!edit_post) return;

                data.edit_post = edit_post;
                data.post_type = edit_post.type;
                data.post_title = edit_post.title;
                data.details = edit_post.text_body;

                if (data.post_type === 'offer') {
                    data.header_text = 'I am offering..';
                    data.title = 'Edit Offer';
                } else {
                    data.header_text = 'I am requesting..';
                    data.title = 'Edit Request';
                }

                var edit_post_end_ms = edit_post.end * 1000,
                    now_ms = (new Date()).getTime(),
                    year_from_now_ms = now_ms + (365*24*3600*1000),
                    category_ids = [];

                if (edit_post_end_ms <= now_ms) {
                    //console.log('edit post date is too old, updating to year from now', edit_post.end);
                    // datepicker breaks if the preset date is in the past
                    edit_post_end_ms = year_from_now_ms;
                }

                data.end_date = new Date(edit_post_end_ms);

                for (var category of edit_post.categories) {
                    category_ids.push(category.id);
                }
                if (category_ids) data.category_ids = category_ids;
            },

            hideActionSheet () {
                this.post_submitted = false;
            },

            viewPost () {

                // TODO later: preload post data to this.$root.post for quicker display.. (see what data Posts.vue sets and Post.vue displays)

                this.hideActionSheet();
                this.$router.load({url: '/post/' + this.new_post_id});
            },

            resetForm () {
                this.post_type = '';
                this.post_title = '';
                this.details = '';
                this.category_ids = []; 

                // XXX: hack to reset category selection display b/c it doesn't reset when the categories property is reset
                window.Dom7('.new-post-categories .item-after')[0].innerHTML = '';
            },

            // TODO later: extract 
            dateToString (dt) {
                var check_add_zero = function(n) { 
                    if (n < 10) {
                        return '0' + n;
                    }
                    return n;
                };

                return dt.getFullYear() + '-' + check_add_zero(dt.getMonth() + 1) + '-' + check_add_zero(dt.getDate());
            },

            submitPost () {
                /*
                console.log(
                    'post type:', this.post_type,
                    ' - post_title: ', this.post_title,
                    ' - details: ', this.details,
                    ' - categories ', this.categories,
                    ' - end date: ', end_date
                );
                */
                //console.log('end date', end_date, this.end_date, end_date === this.end_date, this.end_date2);

                var err,
                    end_date_str = this.dateToString(this.end_date);

                if (!this.post_type) {
                    err = 'Please select whether you are offering or requesting something.';
                } else if (!this.post_title) {
                    err = 'Please enter a title.';
                } else if (!this.details) {
                    err = 'Please enter some details.';
                } else if (this.details.split(' ').length < 3) {
                    err = 'Please enter more details.';
                } else if (!end_date_str) {
                    err = 'Please enter an expiration date.';
                } else if (this.category_ids.length === 0) {
                    err = 'Please select at least one category.';
                } else if (this.category_ids.length > 3) {
                    err = 'Please select fewer categories (max 3).';
                } else {
                    var now_str = this.dateToString(new Date());

                    //console.log('dt check', now_str, end_date_str, now_str >= end_date_str);

                    if (now_str >= end_date_str) {
                        err = 'Please choose an expiration date in the future.';
                    }
                }

                if (err) {
                    this.$f7.addNotification({message: err, hold: 3500});
                    return;
                }

                var args = {
                    type: this.post_type,
                    title: this.post_title,
                    body: this.details,
                    category_ids: this.category_ids,
                    end_date: end_date_str
                };

                if (this.edit_post) {
                    this.$f7.showPreloader('Updating..');

                    Timebank.update_post(
                        this.edit_post.post_id,
                        args,
                        () => {
                            this.$f7.hidePreloader();

                            this.new_post_id = this.edit_post.post_id;
                            // not resetting form b/c still in edit mode
                            this.post_submitted = true; // triggers actionsheet to show
                        },
                        (status, message, logged_out) => {
                            this.$f7.hidePreloader();

                            if (logged_out) {
                                window.timebank_event_bus.$emit('session-expired');
                            } else {
                                this.$f7.addNotification({message: 'Error updating - please try again later.', hold: 3500});
                            }
                        }
                    );
                } else {
                    
                    this.$f7.showPreloader('Submitting..');

                    Timebank.create_post(
                        args,
                        post_id => {

                            this.$f7.hidePreloader();

                            this.new_post_id = post_id;
                            this.resetForm();
                            this.post_submitted = true; // triggers actionsheet to show
                        },
                        (status, message, logged_out) => {
                            this.$f7.hidePreloader();

                            if (logged_out) {
                                window.timebank_event_bus.$emit('session-expired');
                            } else {
                                this.$f7.addNotification({message: 'Error submitting - please try again later.', hold: 3500});
                            }
                        }
                    );
                }

            },

        },

        computed: {
            loaded () {
                return this.edit_post_loaded && this.post_categories_loaded;
            }
        },

        created () {
            var edit_post = this.$root.post;

            // XXX: for deleting jdrupal cache of nodes, run:
            //      for (var prop in localStorage) { if (prop.indexOf('node_') > -1) { delete localStorage[prop]; } }z

            if (this.edit_post_id && !edit_post) {
                Timebank.get_post(
                    this.edit_post_id,
                    edit_post => {
                        this.setEditPost(edit_post, this);
                        this.edit_post_loaded = true;
                    },
                    (status, msg) => {
                        this.load_error = true;
                    }
                );
            } else {
                this.edit_post_loaded = true;
            }

            Timebank.get_post_categories(display_categories => {

                this.display_categories = display_categories;
                this.post_categories_loaded = true;

            }, (status, msg) => {
                this.load_error = true;
            });
        }

    };
</script>

<style>


</style>
