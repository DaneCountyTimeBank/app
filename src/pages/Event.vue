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

    <f7-block v-if="loaded">

        <h4>{{event.title}}</h4>

        <img v-if="event.image" :src="event.image.url" width="100%" :style="{maxWidth: event.image.width + 'px'}" />

        <p v-html="event.body_html"></p>

        <div class="event-block" v-if="event.date">
            <i class="material-icons color-darkgreen">access_time</i>
            <div>
                {{event.date|timestamp_to_date}}<br />
                {{event.date|timestamp_to_time}}
            </div>
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

/* TODO later: extract b/c common style.. or make center-preloader a component.. */
.center-preloader {
    text-align: center;
}



.event-block {
    margin-top: 20px;
    font-size:1.2em;
    float: left;
    clear: left;
    white-space: nowrap;

}
.event-block div {
    float: left;
    border-left: 1px solid #ccc;
    padding-left: 22px;
}
.event-block i {
    display: block;
    float: left;
    margin: 5px 20px 0 0;
}

.event-meta {
    color: #666;
    clear: left;
    float: left;
    margin: 35px 0;
}

.color-darkgreen {
    color: #0f650b;
}

</style>
