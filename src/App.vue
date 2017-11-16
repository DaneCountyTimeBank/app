<template>
  <!-- App -->
  <div id="app" :class="platformClass">

    <!-- Status bar overlay for fullscreen mode-->
    <f7-statusbar />

    <!-- Left Panel / View -->
    <left-panel-view />

    <!-- Views-->
    <f7-views>
      <!-- Right view, it is main view-->
      <f7-view url="/" :init="true" id="main-view" :dynamic-navbar="true" navbar-through main>
        <f7-navbar v-if="isiOS">
          <f7-nav-left>
            <f7-link icon="icon-bars" open-panel="left"></f7-link>
          </f7-nav-left>
          <f7-nav-center>
            Home
          </f7-nav-center>
        </f7-navbar>
        <!-- Pages-->
        <f7-pages>
          <!-- Page, data-page contains page name-->
          <home-page v-if="logged_in" />
          <login-page v-else />
        </f7-pages>
      </f7-view>
    </f7-views>
  </div>
</template>

<script>
  import LeftPanel from './components/LeftPanel';
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
    }
  };
</script>

<style>
  /* style is not `scoped` so navbars in Pages are modified as well */
  @media (min-width: 960px) {
    /* Let's hide panel-opener button when left panel is visible */
    .view-main .navbar .open-panel {
      display: none;
    }
  }
</style>
