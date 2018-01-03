<template>
  <f7-page name="message">
    <f7-navbar sliding :back-link="!feedback && 'Back'">
      <f7-nav-left v-if="feedback">
        <f7-link icon="icon-bars" open-panel="left"></f7-link>
      </f7-nav-left>
      <f7-nav-center>
          {{ title }}
      </f7-nav-center>
    </f7-navbar>
    
    <f7-block class="center-preloader" v-if="!loaded && !load_error">
            <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading - please try again later.
    </f7-block>

    <f7-block v-if="loaded && !feedback">
        Send a message to <a :href="load_user_id | member_link">{{user_name}}</a>.
    </f7-block>

    <!-- to get the right css to work, have to show the below on load w/o a v-if, otherwise it looks different when shown after loaded is set to true -->
    <f7-list form v-if="!load_error">
        <f7-list-item>
            <f7-label>Subject</f7-label>
            <f7-input v-model.trim="subject" type="text" />
        </f7-list-item>
        <f7-list-item>
            <f7-label>Message</f7-label>
            <f7-input type="textarea" v-model.trim="body"></f7-input>
        </f7-list-item>
    </f7-list>

    <f7-block v-if="loaded">
        <f7-button @click="sendMessage()" :disabled="send_disabled" class="send-message-btn button button-fill button-raised">Send Message</f7-button>
    </f7-block>

  </f7-page>
</template>

<script>
    import Timebank from '../timebank';

    export default {
        props: ['user_id'], // also available as this.$route.params.user_id
        name: 'Message',
        data () {

            var feedback = this.$route.path === '/feedback';

            return {
                load_user_id: this.user_id,
                feedback: feedback,
                title: feedback ? 'Feedback' : 'Message',
                user_name: this.$root.view_user_name || ('Member ' + this.user_id),
                current_user: null,
                subject: '',
                body: '',
                user_loaded: false,
                current_user_loaded: false,
                load_error: false,
                send_disabled: false,
            };
        },

        computed: {
            loaded () {
                return this.user_loaded & this.current_user_loaded;
            }
        },

        filters: {
            member_link: user_id => `/member/${user_id}`,
        },

        methods: {

            sendMessage () {

                // TODO later: use this.$el for other Dom7 queries in other pages

                var func,
                    err,
                    args = {
                        subject: this.subject,
                        message: this.body
                    };

                if (!args.subject) {
                    err = 'subject';
                } else if (!args.message) {
                    err = 'message';
                }
                if (err) {
                    this.$f7.addNotification({message: 'Please enter a ' + err + '.', hold: 3500});
                    return;
                }

                this.send_disabled = true;

                if (this.feedback) {

                    // TODO later: fix this later, but for now, direct feedback to the DCTB account
                    func = Timebank.send_msg;
                    args.user_id = 1; // is the user ID for the Dane County TimeBank account

                    /* doesn't work b/c captcha on site contact form requires submitting what code is in the image..
                    func = Timebank.send_site_msg;
                    args.name = this.current_user.name;
                    args.email = this.current_user.mail;
                    */
                } else {
                    // send_msg(recipient, subject, body,
                    func = Timebank.send_msg;
                    args.user_id = this.load_user_id;
                }

                this.$f7.showIndicator();

                func(
                    args,
                    () => {
                        this.$f7.hideIndicator();

                        this.subject = '';
                        this.body = '';

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
        },

        created () {

            // TODO later: support site contact for logged out users

            if (!this.$root.view_user_name && this.load_user_id) {
                Timebank.get_user(
                    this.load_user_id,
                    user => {
                        this.user_name = user.name;
                        this.user_loaded = true;
                    },
                    (status, msg, logged_out) => {

                        if (logged_out) {
                            window.timebank_event_bus.$emit('session-expired');
                        } else {
                            this.load_error = true;
                        }
                    }
                );
            } else {
                this.user_loaded = true;
            }

            Timebank.get_current_user(user => {
                // TODO later: need to normalize the user..
                this.current_user = user;
                this.current_user_loaded = true;
            },
            (status, msg) => {
                this.load_error = true;
            });

        }
    };

</script>

<style>


</style>
