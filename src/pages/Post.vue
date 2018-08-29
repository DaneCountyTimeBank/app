<template>
  <f7-page name="post">
    <f7-navbar sliding back-link="Back">
      <f7-nav-center>
          {{ post.title }}
      </f7-nav-center>
    </f7-navbar>

    <f7-block-title class="post-title">{{post.title}}</f7-block-title>
    <f7-block inner>
        <div class="post-date" v-if="post.created">{{post.changed | timestamp_to_date}}</div>

        {{post | post_type_desc}} 
        <f7-link v-if="post.user_name" :href="post | profile_link" @click="viewProfile(post)">{{post.user_name}}</f7-link>

        <div class="post-chips">
            <f7-chip v-if="post_area" :text="post_area" bg="purple" color="white"></f7-chip>
            <template v-if="post.categories" v-for="category in post.categories">
                &nbsp;<f7-chip :text="category.name" bg="indigo" color="white"></f7-chip>
            </template>
        </div>

        <f7-block class="center-preloader" v-if="!post_loaded && !post_load_error">
            <f7-preloader></f7-preloader>
        </f7-block>
        <f7-block v-if="post_load_error">
            Error loading post - please try again later.
        </f7-block>

        <img class="post-image medium-image" v-if="post.image" :src="post.image.url" />

        <div class="post-body" v-html="post.body"></div>

        <f7-block v-if="!post_load_error && user_load_error">
            <strong>Error loading user - please try again later.</strong>
        </f7-block>

        <template v-if="post_loaded && user_loaded && !reply">
            <div class="post-buttons buttons-row">
                <template v-if="!own_post">
                    
                    <template v-if="!user.offline">
                        <f7-button @click="showReply()" class="button button-fill button-raised">Reply</f7-button>
                    </template>
                    <template v-if="user.offline">
                        <f7-button external :href="'tel:' + user.phones[0]" class="button button-fill button-raised phone-button"><i class="material-icons">phone</i> &nbsp; {{user.phones[0]}}</f7-button>
                    </template>

                    <f7-button @click="submitPayment(post)" :href="post | payment_link" class="button button-raised">{{post | payment_text }}</f7-button>
                </template>
                <template v-if="own_post">
                    <f7-button @click="editPost()" :href="post | edit_link" class="button button-fill button-raised">Edit</f7-button>
                    <f7-button @click="deletePost()" class="button button-raised">Delete</f7-button>
                    <!-- 

                    color-deeporange seems to work well for buttons here but I don't like it for buttons elsewhere..
                    
                    TODO later: could allow recording an exchange where own post is the service that was given or received
                                if an offer, can collect payment from someone else who claimed it
                                if a request, can send payment to someone else who satisfied it
                                will require the exchange flow to know when it's given a post_id w/ a user, it just needs to 
                                select a user

                    XXX: could simplify recording exchanges a bit by separating out the paths of 
                         making payments vs collecting payments
                         b/c presumably a person knows exactly what they want to do at the start
                         and so it will be easier to filter down posts if we know what they are trying to do


                    <f7-button @click="submitPayment(post)" :href="post | payment_link" class="button button-raised">{{post | payment_text }}</f7-button>
                    -->
                </template>
            </div>

            <template v-if="!own_post && user.offline">
                <div class="offline-notice">Offline Member (contact by phone)</div>
            </template>

        </template>

        <template v-if="post_loaded && reply">
            <strong>Reply</strong>
            <f7-list form class="inputs-list">
                <f7-list-item>
                    <f7-input type="textarea" v-model="message" placeholder="Type a message here to send to the author of this post"></f7-input>

                    <!-- trying to get resizable to work, but this didn't work.. and applying class resizable above doesn't put it on the textarea..
                    <div class="item-content">
                        <div class="item-inner">
                            <div class="item-input">
                                <textarea type="textarea" placeholder="Type a message here to send to author of this post" autofocus class="resizable"></textarea>
                            </div>
                        </div>
                    </div>
                    -->

                </f7-list-item>
            </f7-list>

            <f7-button :disabled="send_disabled" @click="sendMessage(post)" class="send-msg-btn button button-fill button-raised">Send Message</f7-button>

            <!--
            <br />
            <span v-if="offer">
                Have you completed this transaction with {{post.user_name}}?
                <f7-button @click="sendMessage(post)" class="button button-raised ">Pay for this</f7-button>
            </span>
            -->
        </template>

        
    </f7-block>

  </f7-page>
</template>

<script>
    import Timebank from '../timebank';

    export default {
        props: ['post_id'], // also available as this.$route.params.post_id
        name: 'Post',
        data () {
            var post = this.$root.post || {
                title: 'Post ' + this.post_id,
                user_name: null,
                body: '',
                image: null,
                categories: [],
                created: null,
                post_word: '', // Offer or Request
            };

            return {
                post: post,
                post_area: null,
                message: null,
                reply: 0,
                post_loaded: false,
                post_load_error: false,
                own_post: false,
                send_disabled: false,
                user_loaded: false,
                user_load_error: false,
                user: false
            };
        },

        filters: {
            post_type_desc: function (post) {
                var desc;
                
                if (post.type === 'want') {
                    desc = 'Request by ';
                } else if (post.type === 'offer') {
                    desc = 'Offer from ';
                } else {
                    desc = '';
                }
                return desc;
            },
            profile_link: post => `/member/${post.user_id}`,
            edit_link: post => `/post/${post.post_id}/edit`,
            payment_link: post => `/exchanges/new?post_id=${post.post_id}&user_id=${post.user_id}`,
            payment_text: post => post.type === 'offer' ? 'Pay for this' : 'Take payment', // or 'Claim for this' or 'Claim Payment'
        },

        methods: {

            sendMessage (post) {

                var recipient = post.user_id,
                    subject = 'Re: ' + post.title,
                    message = this.message;

                if (!message) {
                    this.$f7.addNotification({message: 'Please enter a message.', hold: 3500});
                    return;
                }

                this.send_disabled = true;
                this.$f7.showIndicator(); 
                // TODO: show "Sending..""
                //       this.$f7.showPreloader('Submitting..');
                //       this.$f7.hidePreloader();

                Timebank.send_msg(
                    {user_id: recipient, subject: subject, message: message},
                    () => {
                        // success

                        this.$f7.hideIndicator();

                        this.message = '';
                        this.reply = 0;

                        this.send_disabled = false;

                        this.$f7.addNotification({message: 'Message sent!', hold: 3500});
                    },
                    (status, msg, logged_out) => {
                        this.$f7.hideIndicator();

                        if (logged_out) {
                            window.timebank_event_bus.$emit('session-expired');
                        } else {
                            this.$f7.addNotification({message: 'Error sending message - please try again later.', hold: 3500});
                        }
                    }
                );

            },
            viewProfile (post) {
                this.$root.view_user_name = post.user_name;
            },
            showReply () {
                this.reply = 1;

                //Dom7('textarea').addClass('resizable'); // also doesn't appear to work well
                // textarea gets smaller but doesn't grow when text is added..

                this.$nextTick(() => {

                    var el = window.Dom7('textarea', this.$el),
                        btn = window.Dom7('.send-msg-btn', this.$el);
                    
                    el.closest('.page-content').scrollTo(0, btn.offset().top + btn.height(), 200);
                    el.focus();
                });

            },
            submitPayment (post) {
                this.$root.view_user_name = post.user_name;
                this.$root.post = post;
            },
            editPost () {
                this.$root.post = this.post;
            },

            // TODO later: add unpublish option - figure out how to do via api 
            //             and then will need to show unpublished posts when users are viewing their own posts..

            deletePost () {

                var self = this;

                self.$f7.confirm('Are you sure?', 'Delete ' + self.post_word, function(){

                    self.$f7.showIndicator(); // shows loading but doesn't block interactions w/ the pgae like showPreloader does

                    Timebank.delete_post(self.post.post_id, function(){

                        self.$f7.hideIndicator();
                        self.$f7.addNotification({message: self.post_word + ' deleted!', hold: 4000});

                        self.$router.load({url: '/home'});

                    }, function(status, msg, logged_out){

                        self.$f7.hideIndicator();

                        if (logged_out) {
                            window.timebank_event_bus.$emit('session-expired');
                        } else {
                            self.$f7.addNotification({message: 'Error deleting - please try again later.', hold: 3500});
                        }

                    });
                });

            }
        },
        created () {
            var current_user_id = localStorage.user_id * 1;

            // TODO later: back button from edit post doesn't reload the post.. good but bad..
            //             but viewing post from done editing actionsheet does reload the post.. why is that..
            //             but sometimes back button does reload the post.. oy, don't worry about it for now

            Timebank.get_post(
                this.post_id,
                post => {
                    this.own_post = (post.user_id * 1 === current_user_id);
                    this.post = post;

                    this.post_word = (post.type === 'offer' ? 'Offer' : 'Request');

                    Timebank.get_user(
                        this.post.user_id,
                        user => {
                            if (user.location) this.post.area = this.post_area = user.location.area;
                            this.user = user;
                            this.user_loaded = true;
                        },
                        () => {
                            this.user_load_error = true;
                        }
                    );

                    this.post_loaded = true;
                },
                () => {
                    this.post_load_error = true;
                }
            );
        }
    };

</script>

<style>


.post-title {
    margin-top: 15px;
    white-space: normal;
}

.post-date {
    float:right;
}
.post-chips {
    margin-top: 10px;
    margin-left: -4px;
    margin-bottom: 20px;
}

/* missing on ios so we define it to be the pink ios theme color */
/*
.ios .bg-purple {
    background-color: #ff2d55;
}
*/

.post-image {
    margin-top: 10px;
    margin-bottom: -8px;
}
.post-body {
    margin-bottom: 26px;
}
.post-buttons {
    margin-bottom: 60px;
}

.phone-button i {
    vertical-align: middle;
}

.offline-notice {
    color: #666;
    margin-top: -30px;
}

</style>


<!-- 

TODO later: show expiring date?
TODO later: category links
TODO later: send a copy option

-->

