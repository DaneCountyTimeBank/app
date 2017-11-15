<template>
  <f7-panel left :reveal="isiOS" :cover="isMaterial">
    <f7-navbar title="Menu"></f7-navbar>
    <f7-page>
      <f7-block-title>Links</f7-block-title>
      <f7-list>
        <f7-list-item
          link="/home"
          title="Home"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/post"
          title="New Post"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/offers"
          title="Offers"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/requests"
          title="Requests"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/members/exchange"
          title="Record an Exchange"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/member/me"
          title="Your Account"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/members"
          title="Members"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/about"
          title="About"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          link="/feedback"
          title="Feedback"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
        <f7-list-item
          @click="logout"
          link="/login"
          title="Logout"
          link-view="#main-view"
          link-reload
          link-close-panel
        />
      </f7-list>
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
        isiOS: window.isiOS
      };
    },

    methods: {
        logout () {
            //var self = this;
            
            Timebank.logout(function(){
                // success

                //self.$root.user_id = null;
                delete localStorage.user_id;

                // TODO: only show login page on success..

            }, function(){
                // error

                // TODO: show error messages

            });
        }
    }


  };
</script>

<style scoped>
  .panel-left .page {
    margin-top: 44px;
    padding-bottom: 44px;
  }
  @media (min-width: 960px) {
    .panel.panel-left {
      border-right: 1px solid #b2b2b2;
    }
  }
</style>
