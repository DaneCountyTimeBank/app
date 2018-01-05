<template>
  <f7-page name="login">
    <f7-navbar sliding>
      <f7-nav-center>Dane County TimeBank</f7-nav-center>
    </f7-navbar>

    <f7-block inner class="login-img">
        <img src="static/dctb_logo3.jpg" alt="Dane County TimeBank" width="288" height="198" />
    </f7-block>

    <f7-block-title>Login</f7-block-title>

    <f7-list form class="inputs-list">

      <f7-list-item>
        <f7-input v-model="email" type="text" placeholder="Email"/>
      </f7-list-item>

      <f7-list-item>
        <f7-input v-model="password" type="password" placeholder="Password"/>
      </f7-list-item>

      <f7-list-item>
        <f7-button @click="login()" class="button button-fill button-raised">Login</f7-button>
      </f7-list-item>

    </f7-list>

    <f7-block-title>Not a member yet?</f7-block-title>
    <f7-block inner>
        TimeBank members are a caring and interconnected community of people who help each other by sharing their abilities, talents, and experiences.
        <br /><br />
        As a TimeBank member, you can provide services for other members and you will earn one TimeBank Hour for each hour you spend providing the service – everyone’s time and talents are valued equally. 
        <br /><br />
        You can then exchange each TimeBank Hour you've earned for an hour of service from another TimeBank member.

        <br /><br />
        <strong>To join the Dane County TimeBank</strong>, 
        <f7-link external  href="mailto:join@danecountytimebank.org?subject=Joining%20Dane%20County%20TimeBank">email us</f7-link>
        or call <f7-link external href="tel:6086630400">(608) 663-0400</f7-link>
    </f7-block>

    <f7-block-title>Contact Us</f7-block-title>
    <f7-block inner>
        For general information or help, please <f7-link external href="mailto:info@danecountytimebank.org">email us</f7-link> or call our office number at <f7-link external href="tel:6086630400">(608) 663-0400</f7-link>.
    </f7-block>

  </f7-page>
</template>

<script>

    import Timebank from '../timebank';

    export default {
        name: 'Login',
        data () {
            return {
                title: 'Login Page',
                email: '',
                password: ''
            };
        },

        methods: {

            login () {

                this.$f7.showPreloader('Logging in..');

                Timebank.login(
                    this.email,
                    this.password,
                    user_id => {
                        localStorage.user_id = user_id;
                        window.timebank_event_bus.$emit('login');

                        this.$f7.hidePreloader();

                        // TODO later: use a different router that uses pushState to get better URLs..
                        //             but then would have to have Apache know to load a specific page for a given url..

                        // XXX: need to reference router this way when the component could be loaded w/o a hash path being set
                        //      (eg. any component referenced from App.vue)
                        this.$f7.mainView.router.load({url: '/home'});
                    },
                    (status, message) => {
                        var err;
                        if (message.indexOf('Wrong username or password') > -1 || message.indexOf('bad input') > -1) {
                            this.$f7.hidePreloader();
                            err = 'Error - wrong email or password.';
                        } else if (message.indexOf('Already logged in') > -1) {
                            // may be logged into a different account
                            // so logout before logging in
                            Timebank.logout(() => {
                                delete localStorage.user_id;
                                this.$f7.hidePreloader();
                                this.login();
                            }, (status, msg) => {
                                this.$f7.hidePreloader();
                                this.$f7.addNotification({message: 'Unknown error - please try again later.', hold: 3500});
                            });
                        } else {
                            this.$f7.hidePreloader();
                            err = 'Uknown error - please try again later.';
                        }
                        if (err) {
                            this.$f7.addNotification({message: err, hold: 3500});
                        }
                    }
                );
            },

        }
    };
</script>

<style>

.login-img {
    text-align:center;
    margin-top: 0;
    margin-bottom: 0;
    background: #4cb050;
}
.login-img .content-block-inner {
    padding-top: 0;
    padding-bottom: 0;
}

.login-img img {
    margin: 15px 0 10px 0;
}

</style>
