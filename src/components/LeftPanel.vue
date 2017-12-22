<template>
  <f7-panel left :reveal="isiOS" :cover="isMaterial">
    <f7-navbar :title="logged_in ? 'Menu' : ''"></f7-navbar>
    <f7-page>
      <template v-if="logged_in">
      <f7-list>
        <f7-list-group>
            <f7-list-item title="" group-title></f7-list-item>
            <f7-list-item
              link="/home"
              media="<i class='material-icons color-green2'>home</i>"
              title="Home"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
        </f7-list-group>
        <f7-list-group>
            <f7-list-item title="" group-title></f7-list-item>
            <f7-list-item
              link="/post"
              media="<i class='material-icons color-green2'>create</i>"
              title="List Offer / Request"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
            <f7-list-item
              link="/offers"
              media="<i class='material-icons color-green2'>local_offer</i>"
              title="Offers"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
            <f7-list-item
              link="/requests"
              media="<i class='material-icons color-green2'>local_offer</i>"
              title="Requests"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
            <f7-list-item
              link="/members/exchange"
              media="<i class='material-icons color-green2'>assignment</i>"
              title="Record Exchange"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
        </f7-list-group>
        <f7-list-group>
            <f7-list-item title="" group-title></f7-list-item>
            <f7-list-item
              link="/members"
              media="<i class='material-icons color-green2'>people</i>"
              title="Members"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
        </f7-list-group>
        <f7-list-group>
            <f7-list-item title="" group-title></f7-list-item>
            <f7-list-item
              link="/member/me"
              media="<i class='material-icons color-green2'>account_box</i>"
              title="Your Account"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
        </f7-list-group>
        <f7-list-group>
            <f7-list-item title="" group-title></f7-list-item>
            <f7-list-item
              link="/about"
              media="<i class='material-icons color-green2'>info</i>"
              title="About"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
            <f7-list-item
              link="/feedback"
              media="<i class='material-icons color-green2'>message</i>"
              title="Feedback"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
            <f7-list-item
              @click.prevent.stop="logout"
              link="#"
              media="<i class='material-icons color-green2'>exit_to_app</i>"
              title="Logout"
              link-view="#main-view"
              link-reload
              link-close-panel
            />
        </f7-list-group>
      </f7-list>
      </template>
    </f7-page>
  </f7-panel>
</template>

<script>
  import Timebank from '../timebank';

  export default {
    name: 'LeftPanel',
    data () {
      return {
        isMaterial: window.isMaterial,
        isiOS: window.isiOS,
        logged_in: localStorage.user_id
      };
    },

    created () {
        // TODO later: use proper state managment instead of a global event bus
        window.timebank_event_bus.$on('login', () => {
            this.logged_in = true;
        });
        window.timebank_event_bus.$on('logout', () => {
            this.logged_in = false;
        });
    },

    methods: {

        // TODO: invite a friend to join functionality (social media & email options)
        // TODO: become a trained onboarder / coordinator functionality

        // TODO later: provide menu, links & functionality (eg. contact form) for logged out users

        logoutSuccess () {
            delete localStorage.user_id;
            window.timebank_event_bus.$emit('logout');

            // XXX: need to reference router this way when the component could be loaded w/o a hash path being set
            //      (eg. any component referenced from App.vue)
            this.$f7.mainView.router.load({url: '/login'});
        },

        logout () {
            this.$f7.closePanel();
            this.$f7.showPreloader('Logging out..');

            Timebank.logout(() => {
                this.$f7.hidePreloader();
                this.logoutSuccess();
            }, (status, message) => {
                this.$f7.hidePreloader();
                if (message.indexOf('User is not logged in.') > -1) {
                    this.logoutSuccess();
                } else {
                    this.$f7.addNotification({message: 'Error logging out - please try again later.', hold: 3500});
                }
            });
        }
    }


  };
</script>

<style scoped>
  .panel-left .page {
    margin-top: 44px;
  }
  .panel-left .list-block {
    margin-bottom: 0;
  }
  
  .panel-left .page, .panel-left .page-content {
    height: auto;
  }

  @media (min-width: 960px) {
    .panel.panel-left {
      border-right: 1px solid #b2b2b2;
    }
  }

  .list-group-title {
    height: 16px;
  }
  .list-block {
    margin-top: 5px;
  }
  /*
  .android .list-block {
    margin-top: 5px;
  }
  .ios .list-block {
    margin-top: 0;
  }
  */

</style>
