<template>
  <div id="app" :class="platformClass">

    <f7-statusbar />

    <left-panel-view />
    <right-panel-view />

    <f7-views>
      <f7-view url="/" :init="true" id="main-view" :dynamic-navbar="true" navbar-through main>

        <f7-navbar v-if="isiOS">
          <f7-nav-left>
            <f7-link icon="icon-bars" open-panel="left"></f7-link>
          </f7-nav-left>
          <f7-nav-center>
            Home
          </f7-nav-center>
        </f7-navbar>

        <f7-pages>
          <home-page v-if="logged_in" />
          <login-page v-else />
        </f7-pages>

      </f7-view>
    </f7-views>
  </div>
</template>

<script>
  import LeftPanel from './components/LeftPanel';
  import RightPanel from './components/RightPanel';
  import Home from './pages/Home';
  import Login from './pages/Login';

  export default {
    name: 'App',
    data () {
        return {
            logged_in: localStorage.user_id
        };
    },
    components: {
      'left-panel-view': LeftPanel,
      'right-panel-view': RightPanel,
      'home-page': Home,
      'login-page': Login
    },
    computed: {
      isiOS () {
        return window.isiOS;
      },
      platformClass () {
        return window.isiOS ? 'ios' : 'material';
      }
    },
    created () {
        window.timebank_event_bus.$on('login', () => {
            this.logged_in = true;
        });
        window.timebank_event_bus.$on('logout', () => {
            this.logged_in = false;
        });
    },
  };
</script>

<style> 
</style>
