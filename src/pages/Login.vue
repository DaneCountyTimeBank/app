<template>
  <f7-page name="login">
    <f7-navbar sliding>
      <f7-nav-center>
        Dane County TimeBank
      </f7-nav-center>
    </f7-navbar>
    <!-- Scrollable page content-->

    <f7-block-title>Login</f7-block-title>

    <f7-list form>

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

    <f7-block inner >
        <p>
            TimeBank members are a caring and interconnected community of people who help each other by sharing their abilities, talents, and experiences.
            <br /><br />
            As a TimeBank member, you can provide services for other members and you will earn one TimeBank Hour for each hour you spend providing the service – everyone’s time and talents are valued equally. 
            <br /><br />
            You can then exchange each TimeBank Hour you've earned for an hour of service from another TimeBank member.
            <br /><br />
            <strong>To join the Dane County TimeBank</strong>, 
            email <f7-link external  href="mailto:join@danecountytimebank.org?subject=Joining%20Dane%20County%20TimeBank">join@danecountytimebank.org</f7-link>
            or call <f7-link external href="tel:6086630400">(608) 663-0400</f7-link>
        </p>
    </f7-block>
    <!--
    based on:
    https://danecountytimebank.org/
    https://danecountytimebank.org/join
    -->

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

                var self = this;

                self.$f7.showPreloader('Logging in..');

                Timebank.login(this.email, this.password, function(user_id){

                    localStorage.user_id = user_id;
                    //self.$root.user_id = user_id;

                    self.$f7.hidePreloader();

                    self.$router.load({url: '/home'});

                }, function(status, message){
                    
                    self.$f7.hidePreloader();

                    var err;
                    if (message.indexOf('Wrong username or password') > -1 || message.indexOf('bad input') > -1) {
                        err = 'Error - wrong email or password.';
                    } else if (message.indexOf('Already logged in') > -1) {
                        // assume they are logged into their own account..
                        self.$router.load({url: '/home'});
                    } else {
                        err = 'Uknown error - please try again later.';
                    }
                    if (err) {
                        self.$f7.addNotification({message: err, hold: 3500});
                    }
                });
            },

        }
    };
</script>

<style>



</style>
