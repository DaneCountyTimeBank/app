<template>
  <f7-page name="event">
    <f7-navbar sliding back-link="Back">
      <f7-nav-center>
          {{event.title}}
      </f7-nav-center>
    </f7-navbar>

    <f7-block class="center-preloader" v-if="!loaded && !load_error">
        <f7-preloader></f7-preloader>
    </f7-block>
    <f7-block v-if="load_error">
        Error loading event - please try again later.
    </f7-block>

    <f7-block-title class="event-title">{{event.title}}</f7-block-title>
    <f7-block inner v-if="loaded">

        <img v-if="event.image" :src="event.image.url" class="medium-image" />

        <div class="event-body" v-html="event.body_html"></div>

        <div class="event-block" v-if="event.datetime_start">
            <i class="material-icons color-darkgreen">access_time</i>
            <div v-html="$options.filters.event_to_datetime_details(event)"></div>
        </div>

        <div class="event-block" v-if="event.details_html">
            <i class="material-icons color-red">place</i>
            <div v-html="event.details_html"></div>
        </div>

        <div class="event-meta">
            Posted {{event.created | timestamp_to_date}} by {{event.user_name}}
        </div>
    </f7-block>

  </f7-page>
</template>


<script>

    import Timebank from '../timebank';

    export default {
        props: ['event_id'],
        name: 'Event',
        data () {
            return {
                event: this.$root.event || {},
                loaded: false,
                load_error: false,
            };
        },

        created () {
            Timebank.get_event(
                this.event_id,
                event => {
                    this.loaded = true;
                    this.event = event;
                },
                (status, msg) => {
                    this.load_error = true;
                }
            );
        }
    };

</script>

<style>

.center-preloader {
    text-align: center;
}

.event-title {
    white-space: normal;
    margin-top: 15px;
    text-transform: none;
}
.event-block {
   margin-top: 20px;
   font-size:1.2em;
}
.event-block div {
    overflow: hidden; 
    border-left: 1px solid #ccc;
    padding-left: 22px;   
}
.event-block i {
    display: block;
    width: 28px;
    float: left;
    margin: 5px 20px 10px 0;
}

.event-meta {
    margin: 35px 0;
    color: #666;
}

.color-darkgreen {
    color: #0f650b;
}

.event-body p {
    margin-left: 0;
    margin-right: 0;
}

.event-body {
    margin-top: 1em;
}


</style>
