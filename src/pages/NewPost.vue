<template>
  <f7-page name="newpost">
    <f7-navbar sliding>
      <f7-nav-left>
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
        {{title}}
      </f7-nav-center>
    </f7-navbar>

    <f7-list form>
      <f7-list-item group-title title="I am.."></f7-list-item>
      <f7-list-item v-model="post_type" radio name="offer-want" value="offer" input-value="offer" title="Offering"></f7-list-item>
      <f7-list-item v-model="post_type" radio name="offer-want" value="want" input-value="want" title="Requesting"></f7-list-item>

      <f7-list-item>
        <f7-label>Title</f7-label>
        <f7-input v-model.trim="post_title" type="text" placeholder=""/>
      </f7-list-item>

      <f7-list-item>
        <f7-label>Details</f7-label>
        <f7-input v-model.trim="details" type="textarea" placeholder=""></f7-input>
      </f7-list-item>

      <f7-list-item v-if="display_categories" smart-select title="Categories" class="new-post-categories">
        <improved-select v-model="category_ids" :options="display_categories"></improved-select>
      </f7-list-item>

      <f7-list-item>
        <f7-label>Expires</f7-label>
        <improved-datepicker v-model="end_date" :min-date="min_date"></improved-datepicker>
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
                year_from_now_ms = now_ms + (365*24*3600*1000),

                edit_post_id = this.$route.params.post_id,

                end_time_ms = year_from_now_ms,

                defaults = {
                    title: edit_post_id ? 'Edit Post' : 'New Post',
                    display_categories: null,
                    min_date: new Date(), // don't allow selecting a date before today

                    post_type: '',
                    post_title: '',
                    details: '',
                    category_ids: [],
                    end_date: new Date(end_time_ms), // works for initial assignment but doesn't track datepicker changes

                    post_submitted: false,
                    new_post_id: null,
                    edit_post: null,
                    submitted_text: edit_post_id ? 'Post updated!' : 'Post submitted!',
                    submitted_hide_text: edit_post_id ? 'Continue editing' : 'New Post',
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
                data.details = edit_post.body;

                var edit_post_end_ms = edit_post.end * 1000,
                    now_ms = (new Date()).getTime(),
                    year_from_now_ms = now_ms + (365*24*3600*1000),
                    category_ids = [];

                if (edit_post_end_ms <= now_ms) {
                    console.log('edit post date is too old, updating to year from now', edit_post.end);
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
                } else if (!end_date_str) {
                    err = 'Please enter an expiration date.';
                } else if (this.category_ids.length === 0) {
                    err = 'Please select at least one category.';
                } else {
                    var now_str = this.dateToString(new Date());

                    console.log('dt check', now_str, end_date_str, now_str >= end_date_str);

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
                    this.$f7.showPreloader('Updating post..');

                    Timebank.update_post(
                        this.edit_post.post_id,
                        args,
                        () => {
                            this.$f7.hidePreloader();

                            this.new_post_id = this.edit_post.post_id;
                            // not resetting form b/c still in edit mode
                            this.post_submitted = true; // triggers actionsheet to show
                        },
                        (status, message) => {
                            this.$f7.hidePreloader();
                            this.$f7.addNotification({message: 'Error updating post - please try again later.', hold: 3500});
                        }
                    );
                } else {
                    
                    this.$f7.showPreloader('Submitting post..');

                    Timebank.create_post(
                        args,
                        post_id => {

                            this.$f7.hidePreloader();

                            this.new_post_id = post_id;
                            this.resetForm();
                            this.post_submitted = true; // triggers actionsheet to show
                        },
                        (status, message) => {
                            this.$f7.hidePreloader();
                            this.$f7.addNotification({message: 'Error submitting post - please try again later.', hold: 3500});
                        }
                    );
                }

            },

        },

        created () {
            var edit_post_id = this.$route.params.post_id,
                edit_post = this.$root.post;

            if (edit_post_id && !edit_post) {
                Timebank.get_post(
                    edit_post_id,
                    edit_post => {
                        this.setEditPost(edit_post, this);
                    },
                    (status, msg) => {

                        // TODO: handle error loading and show can't edit post right now message & prevent form from showing

                    }
                );
            }

            Timebank.get_post_categories(display_categories => {

                this.display_categories = display_categories;

            }, (status, msg) => {
                this.$f7.addNotification({message: 'Error loading categories, please try again later.', hold: 3500});

                // TODO: hopefully rare but may want to disable the new post form if this does happen
                //      so people don't fill it out..
                
            });
        }

    };
</script>

<style>



</style>
